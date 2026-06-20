<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\BusinessSubscription;
use App\Models\Package;
use App\Models\PaymentTransaction;
use App\Services\AuditService;
use GuzzleHttp\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubscriptionController extends Controller
{
    public function current(Request $request): JsonResponse
    {
        $user = auth()->user();
        $business = Business::where('user_id', $user->id)->first();

        if (!$business) {
            return response()->json(['success' => true, 'data' => ['subscription' => null, 'payments' => []]]);
        }

        $subscription = BusinessSubscription::where('business_id', $business->id)
            ->whereIn('status', ['TRIAL', 'ACTIVE'])
            ->with('package')
            ->orderByDesc('starts_at')
            ->first();

        $payments = \App\Models\PaymentTransaction::where('business_id', $business->id)
            ->with('package')
            ->orderByDesc('created_at')
            ->take(20)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'amount' => (float) $t->amount,
                'currency' => $t->currency,
                'status' => $t->status,
                'billingCycle' => $t->billing_cycle,
                'provider' => $t->provider,
                'externalId' => $t->external_id,
                'checkoutUrl' => $t->checkout_url,
                'paidAt' => $t->paid_at,
                'failedAt' => $t->failed_at,
                'createdAt' => $t->created_at,
                'package' => $t->package ? ['id' => $t->package->id, 'name' => $t->package->name] : null,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'subscription' => $subscription ? $this->formatSubscription($subscription) : null,
                'payments' => $payments,
            ],
        ]);
    }

    public function checkout(Request $request): JsonResponse
    {
        $user = auth()->user();
        $data = $request->validate([
            'packageId' => 'required|uuid',
            'billingCycle' => 'required|in:MONTHLY,YEARLY',
            'phone' => 'nullable|string',
            'customerPhone' => 'nullable|string',
        ]);

        $data['phone'] = $data['phone'] ?? $data['customerPhone'] ?? null;

        $business = Business::where('user_id', $user->id)->first();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $package = Package::where('id', $data['packageId'])->where('status', 'ACTIVE')->first();
        if (!$package) {
            return response()->json(['success' => false, 'error' => 'Package not found'], 404);
        }

        $amount = $data['billingCycle'] === 'YEARLY'
            ? ($package->price_yearly ?? $package->price_monthly * 12)
            : $package->price_monthly;

        $externalId = Str::uuid()->toString();

        try {
            $azamToken = $this->getAzamPayToken();

            $checkoutPayload = [
                'appName' => env('AZAMPAY_APP_NAME'),
                'clientId' => env('AZAMPAY_CLIENT_ID'),
                'vendorId' => env('AZAMPAY_VENDOR_ID'),
                'vendorName' => env('AZAMPAY_VENDOR_NAME'),
                'language' => 'SW',
                'currency' => $package->currency,
                'externalId' => $externalId,
                'requestOrigin' => env('APP_URL'),
                'redirectFailURL' => env('AZAMPAY_RETURN_URL') . '?status=failed',
                'redirectSuccessURL' => env('AZAMPAY_RETURN_URL') . '?status=success',
                'websiteURL' => env('APP_URL'),
                'cart' => [
                    'items' => [[
                        'name' => $package->name,
                        'quantity' => 1,
                        'amount' => $amount,
                        'id' => $package->id,
                    ]],
                ],
                'payments' => null,
            ];

            $client = new Client(['timeout' => 30]);
            $response = $client->post(env('AZAMPAY_CHECKOUT_URL'), [
                'headers' => [
                    'Authorization' => 'Bearer ' . $azamToken,
                    'Content-Type' => 'application/json',
                ],
                'json' => $checkoutPayload,
            ]);

            $result = json_decode($response->getBody(), true);

            $transaction = PaymentTransaction::create([
                'id' => Str::uuid(),
                'business_id' => $business->id,
                'package_id' => $package->id,
                'status' => 'PENDING',
                'billing_cycle' => $data['billingCycle'],
                'amount' => $amount,
                'currency' => $package->currency,
                'provider' => 'AZAMPAY',
                'external_id' => $externalId,
                'checkout_url' => $result['data']['url'] ?? null,
                'raw_request' => $checkoutPayload,
                'raw_response' => $result,
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'transactionId' => $transaction->id,
                    'checkoutUrl' => $result['data']['url'] ?? null,
                    'externalId' => $externalId,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => 'Payment initiation failed: ' . $e->getMessage()], 500);
        }
    }

    public function azamPayCallback(Request $request): JsonResponse
    {
        $data = $request->all();
        $externalId = $data['externalId'] ?? $data['orderId'] ?? null;

        if (!$externalId) {
            return response()->json(['success' => false, 'error' => 'Missing externalId'], 400);
        }

        $transaction = PaymentTransaction::where('external_id', $externalId)->first();
        if (!$transaction) {
            return response()->json(['success' => false, 'error' => 'Transaction not found'], 404);
        }

        $status = strtolower($data['transactionStatus'] ?? $data['status'] ?? '');
        $isPaid = in_array($status, ['success', 'successful', 'paid', 'completed']);

        $transaction->update([
            'status' => $isPaid ? 'PAID' : 'FAILED',
            'provider_reference' => $data['paymentReference'] ?? $data['transactionId'] ?? null,
            'raw_response' => $data,
            'paid_at' => $isPaid ? now() : null,
            'failed_at' => !$isPaid ? now() : null,
        ]);

        if ($isPaid) {
            $package = Package::find($transaction->package_id);
            $billingCycle = $transaction->billing_cycle;

            $endsAt = match($billingCycle) {
                'YEARLY' => now()->addYear(),
                'LIFETIME' => null,
                default => now()->addMonth(),
            };

            $sub = BusinessSubscription::create([
                'id' => Str::uuid(),
                'business_id' => $transaction->business_id,
                'package_id' => $transaction->package_id,
                'status' => 'ACTIVE',
                'billing_cycle' => $billingCycle,
                'starts_at' => now(),
                'ends_at' => $endsAt,
            ]);

            $transaction->update(['subscription_id' => $sub->id]);

            AuditService::log([
                'action' => 'SUBSCRIPTION_ACTIVATED',
                'target_type' => 'BusinessSubscription',
                'target_id' => $sub->id,
                'details' => ['transactionId' => $transaction->id],
            ]);
        }

        return response()->json(['success' => true, 'data' => ['status' => $isPaid ? 'PAID' : 'FAILED']]);
    }

    private function getAzamPayToken(): string
    {
        $client = new Client(['timeout' => 30]);
        $response = $client->post(env('AZAMPAY_AUTH_URL'), [
            'json' => [
                'appName' => env('AZAMPAY_APP_NAME'),
                'clientId' => env('AZAMPAY_CLIENT_ID'),
                'clientSecret' => env('AZAMPAY_CLIENT_SECRET'),
            ],
        ]);
        $result = json_decode($response->getBody(), true);
        return $result['data']['accessToken'] ?? $result['accessToken'];
    }

    private function formatSubscription(BusinessSubscription $sub): array
    {
        return [
            'id' => $sub->id,
            'businessId' => $sub->business_id,
            'status' => $sub->status,
            'billingCycle' => $sub->billing_cycle,
            'startsAt' => $sub->starts_at,
            'endsAt' => $sub->ends_at,
            'trialEndsAt' => $sub->trial_ends_at,
            'package' => $sub->package ? [
                'id' => $sub->package->id,
                'name' => $sub->package->name,
                'slug' => $sub->package->slug,
                'priceMonthly' => (float) $sub->package->price_monthly,
                'priceYearly' => $sub->package->price_yearly ? (float) $sub->package->price_yearly : null,
                'currency' => $sub->package->currency,
                'maxProducts' => $sub->package->max_products,
                'maxSalesPerMonth' => $sub->package->max_sales_per_month,
                'allowReports' => $sub->package->allow_reports,
                'allowAiInsights' => $sub->package->allow_ai_insights,
            ] : null,
        ];
    }
}
