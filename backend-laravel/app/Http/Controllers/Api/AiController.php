<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Expense;
use App\Models\Sale;
use GuzzleHttp\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiController extends Controller
{
    public function generateBusinessSummary(Request $request): JsonResponse
    {
        $user = auth()->user();
        $business = Business::where('user_id', $user->id)->first();

        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $startDate = now()->startOfMonth()->toDateString();
        $endDate = now()->endOfMonth()->toDateString();

        $totalRevenue = Sale::where('business_id', $business->id)->whereBetween('sale_date', [$startDate, $endDate])->sum('total_amount');
        $totalExpenses = Expense::where('business_id', $business->id)->whereBetween('expense_date', [$startDate, $endDate])->sum('amount');
        $totalSales = Sale::where('business_id', $business->id)->whereBetween('sale_date', [$startDate, $endDate])->count();
        $profit = $totalRevenue - $totalExpenses;

        $prompt = "You are a business analyst. Provide a brief, insightful summary for the business '{$business->name}' based on this month's data:
- Total Revenue: {$business->currency} {$totalRevenue}
- Total Expenses: {$business->currency} {$totalExpenses}
- Net Profit: {$business->currency} {$profit}
- Total Sales: {$totalSales}

Provide 3-4 sentences of insights and recommendations. Be concise and actionable.";

        try {
            $apiKey = env('OPENAI_API_KEY');
            if (!$apiKey) {
                return response()->json(['success' => false, 'error' => 'AI service not configured'], 503);
            }

            $client = new Client(['timeout' => 30]);
            $response = $client->post('https://api.openai.com/v1/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => 'gpt-3.5-turbo',
                    'messages' => [['role' => 'user', 'content' => $prompt]],
                    'max_tokens' => 300,
                    'temperature' => 0.7,
                ],
            ]);

            $result = json_decode($response->getBody(), true);
            $summary = $result['choices'][0]['message']['content'] ?? 'Unable to generate summary.';

            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => trim($summary),
                    'metrics' => [
                        'revenue' => (float) $totalRevenue,
                        'expenses' => (float) $totalExpenses,
                        'profit' => (float) $profit,
                        'totalSales' => $totalSales,
                    ],
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => 'AI service unavailable'], 503);
        }
    }
}
