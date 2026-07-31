<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $now = now();

            $upsert = static function (string $table, array $match, array $values) use ($now): string {
                $existing = DB::table($table)->where($match)->first();

                if ($existing) {
                    DB::table($table)->where('id', $existing->id)->update(array_merge($values, [
                        'updated_at' => $now,
                    ]));

                    return $existing->id;
                }

                $id = (string) Str::uuid();
                DB::table($table)->insert(array_merge($match, $values, [
                    'id' => $id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]));

                return $id;
            };

            $demoEmail = env('DEMO_USER_EMAIL', 'demo@biztrack.app');
            $demoPassword = env('DEMO_USER_PASSWORD', 'Demo@1234');

            $userId = $upsert('users', ['email' => $demoEmail], [
                'name' => 'BizTrack Demo Owner',
                'phone' => '+255 712 345 678',
                'password_hash' => Hash::make($demoPassword),
                'role' => 'USER',
                'status' => 'ACTIVE',
                'email_verified_at' => $now,
                'failed_login_attempts' => 0,
                'locked_until' => null,
            ]);

            $packageId = $upsert('packages', ['slug' => 'demo'], [
                'name' => 'Demo',
                'description' => 'Full-featured package for the BizTrack demonstration account.',
                'price_monthly' => 0,
                'price_yearly' => 0,
                'currency' => 'TZS',
                'trial_days' => 365,
                'max_businesses' => 3,
                'max_users' => 10,
                'max_products' => 1000,
                'max_sales_per_month' => 10000,
                'max_expenses_per_month' => 10000,
                'allow_reports' => true,
                'allow_pdf_export' => true,
                'allow_csv_export' => true,
                'allow_inventory_alerts' => true,
                'allow_ai_insights' => true,
                'status' => 'ACTIVE',
                'is_visible' => false,
                'sort_order' => 99,
            ]);

            $businessId = $upsert('businesses', ['user_id' => $userId, 'name' => 'Mlimani Mini Mart'], [
                'currency' => 'TZS',
                'country' => 'Tanzania',
                'tax_name' => 'VAT',
                'tax_number' => 'DEMO-123456',
                'default_tax_rate' => 0,
            ]);

            $branchId = $upsert('branches', ['business_id' => $businessId, 'code' => 'MAIN'], [
                'name' => 'Mlimani City Branch',
                'phone' => '+255 712 345 678',
                'address' => 'Sam Nujoma Road, Dar es Salaam',
                'is_default' => true,
                'is_active' => true,
            ]);

            $upsert('business_memberships', ['business_id' => $businessId, 'user_id' => $userId], [
                'branch_id' => $branchId,
                'role' => 'OWNER',
                'permissions' => json_encode(['*']),
                'status' => 'ACTIVE',
            ]);

            $upsert('business_subscriptions', ['business_id' => $businessId, 'package_id' => $packageId], [
                'status' => 'ACTIVE',
                'billing_cycle' => 'MANUAL',
                'starts_at' => $now->copy()->subMonth(),
                'ends_at' => $now->copy()->addYear(),
                'trial_ends_at' => null,
                'notes' => 'Seeded demo subscription.',
            ]);

            $categoryIds = [];
            foreach ([
                ['Food & Groceries', 'Everyday packaged foods and cooking essentials.'],
                ['Beverages', 'Water, juice, soda, and other drinks.'],
                ['Household', 'Cleaning and household supplies.'],
            ] as [$name, $description]) {
                $categoryIds[$name] = $upsert('categories', ['business_id' => $businessId, 'name' => $name], [
                    'description' => $description,
                    'is_active' => true,
                ]);
            }

            $supplierIds = [];
            foreach ([
                ['Dar Wholesale Traders', '+255 713 110 220', 'orders@darwholesale.demo', 'Kariakoo, Dar es Salaam', 150000],
                ['Coastal Distributors', '+255 754 330 440', 'sales@coastal.demo', 'Mikocheni, Dar es Salaam', 0],
            ] as [$name, $phone, $email, $address, $balance]) {
                $supplierIds[$name] = $upsert('suppliers', ['business_id' => $businessId, 'name' => $name], [
                    'phone' => $phone,
                    'email' => $email,
                    'address' => $address,
                    'balance' => $balance,
                    'is_active' => true,
                ]);
            }

            $brandIds = [];
            foreach (['Azam', 'Mo Xtra', 'Fresh Home'] as $brand) {
                $brandIds[$brand] = $upsert('brands', ['business_id' => $businessId, 'name' => $brand], [
                    'description' => "$brand demo products",
                    'is_active' => true,
                ]);
            }

            $products = [
                ['Rice 5kg', 'RICE-5KG', '620100000001', 'Food & Groceries', 'Dar Wholesale Traders', 'Azam', 'pack', 12000, 15500, 36, 8],
                ['Cooking Oil 1L', 'OIL-1L', '620100000002', 'Food & Groceries', 'Dar Wholesale Traders', 'Azam', 'litre', 4500, 6000, 28, 6],
                ['Sugar 1kg', 'SUGAR-1KG', '620100000003', 'Food & Groceries', 'Dar Wholesale Traders', 'Azam', 'kg', 2400, 3200, 5, 8],
                ['Bottled Water 1.5L', 'WATER-15', '620100000004', 'Beverages', 'Coastal Distributors', 'Mo Xtra', 'pcs', 700, 1200, 64, 12],
                ['Orange Juice 1L', 'JUICE-ORG', '620100000005', 'Beverages', 'Coastal Distributors', 'Mo Xtra', 'litre', 2800, 4000, 18, 5],
                ['Laundry Soap 1kg', 'SOAP-1KG', '620100000006', 'Household', 'Coastal Distributors', 'Fresh Home', 'pcs', 3500, 5000, 22, 5],
                ['Dishwashing Liquid', 'DISH-500', '620100000007', 'Household', 'Coastal Distributors', 'Fresh Home', 'pcs', 2200, 3500, 3, 6],
                ['Tissue Pack', 'TISSUE-10', '620100000008', 'Household', 'Dar Wholesale Traders', 'Fresh Home', 'pack', 6500, 8500, 14, 4],
            ];

            $productIds = [];
            foreach ($products as [$name, $sku, $barcode, $category, $supplier, $brand, $unit, $buying, $selling, $stock, $reorder]) {
                $productIds[$sku] = $upsert('products', ['business_id' => $businessId, 'sku' => $sku], [
                    'name' => $name,
                    'barcode' => $barcode,
                    'brand' => $brand,
                    'brand_id' => $brandIds[$brand],
                    'unit_type' => $unit,
                    'category_id' => $categoryIds[$category],
                    'supplier_id' => $supplierIds[$supplier],
                    'buying_price' => $buying,
                    'selling_price' => $selling,
                    'stock_quantity' => $stock,
                    'low_stock_level' => $reorder,
                    'reorder_point' => $reorder,
                    'expiry_date' => null,
                    'image_url' => null,
                    'notes' => 'Seeded demo product.',
                    'is_active' => true,
                ]);

                $upsert('stock_movements', [
                    'business_id' => $businessId,
                    'product_id' => $productIds[$sku],
                    'reference_type' => 'DEMO_OPENING_BALANCE',
                ], [
                    'branch_id' => $branchId,
                    'movement_type' => 'STOCK_IN',
                    'quantity' => $stock,
                    'stock_before' => 0,
                    'stock_after' => $stock,
                    'reference_id' => null,
                    'reason' => 'Demo opening stock.',
                    'created_by' => $userId,
                ]);
            }

            $customerIds = [];
            foreach ([
                ['Asha Mushi', '+255 713 555 101', 'asha@example.demo', 'Sinza, Dar es Salaam', 500000, 78000],
                ['John Mrema', '+255 754 555 202', 'john@example.demo', 'Mbezi, Dar es Salaam', 300000, 0],
                ['Neema Joseph', '+255 765 555 303', 'neema@example.demo', 'Kimara, Dar es Salaam', 250000, 44100],
            ] as [$name, $phone, $email, $address, $limit, $balance]) {
                $customerIds[$name] = $upsert('customers', ['business_id' => $businessId, 'name' => $name], [
                    'phone' => $phone,
                    'email' => $email,
                    'address' => $address,
                    'credit_limit' => $limit,
                    'credit_balance' => $balance,
                    'is_active' => true,
                ]);
            }

            $promotionId = $upsert('promotions', ['business_id' => $businessId, 'code' => 'KARIBU10'], [
                'name' => 'Karibu Discount',
                'type' => 'PERCENTAGE',
                'value' => 10,
                'minimum_purchase' => 20000,
                'maximum_discount' => 10000,
                'starts_at' => $now->copy()->subMonth(),
                'ends_at' => $now->copy()->addMonths(3),
                'usage_limit' => 100,
                'times_used' => 1,
                'is_active' => true,
            ]);

            $sales = [
                ['BT-DEMO-0001', null, null, 'CASH', 30500, 0, 0, 30500, -20, [['RICE-5KG', 1, 15500], ['WATER-15', 5, 1200], ['SOAP-1KG', 1, 5000], ['JUICE-ORG', 1, 4000]]],
                ['BT-DEMO-0002', 'John Mrema', null, 'MOBILE_MONEY', 30400, 1400, 0, 29000, -12, [['OIL-1L', 2, 6000], ['SUGAR-1KG', 2, 3200], ['DISH-500', 1, 3500], ['TISSUE-10', 1, 8500]]],
                ['BT-DEMO-0003', 'Asha Mushi', null, 'CREDIT', 118000, 0, 0, 40000, -8, [['RICE-5KG', 6, 15500], ['SOAP-1KG', 5, 5000]]],
                ['BT-DEMO-0004', 'Neema Joseph', $promotionId, 'CREDIT', 49000, 0, 4900, 0, -3, [['JUICE-ORG', 5, 4000], ['TISSUE-10', 2, 8500], ['WATER-15', 10, 1200]]],
                ['BT-DEMO-0005', null, null, 'BANK', 42900, 2900, 0, 40000, -1, [['RICE-5KG', 2, 15500], ['OIL-1L', 1, 6000], ['DISH-500', 1, 3500], ['WATER-15', 2, 1200]]],
            ];

            $saleIds = [];
            foreach ($sales as [$receipt, $customerName, $salePromotionId, $method, $subtotal, $discount, $promotionDiscount, $paid, $daysAgo, $items]) {
                $customerId = $customerName ? $customerIds[$customerName] : null;
                $quantity = collect($items)->sum(fn (array $item) => $item[1]);
                $saleDate = $now->copy()->addDays($daysAgo)->toDateString();
                $saleId = $upsert('sales', ['business_id' => $businessId, 'receipt_number' => $receipt], [
                    'branch_id' => $branchId,
                    'customer_id' => $customerId,
                    'promotion_id' => $salePromotionId,
                    'product_id' => null,
                    'customer_name' => $customerName,
                    'quantity' => $quantity,
                    'unit_price' => round($subtotal / $quantity, 2),
                    'total_amount' => $subtotal,
                    'discount' => $discount,
                    'promotion_discount' => $promotionDiscount,
                    'tax_rate' => 0,
                    'tax_amount' => 0,
                    'paid_amount' => $paid,
                    'initial_paid_amount' => $paid,
                    'payment_due_date' => $paid < ($subtotal - $discount - $promotionDiscount) ? $now->copy()->addDays($daysAgo + 14)->toDateString() : null,
                    'payment_method' => $method,
                    'sale_date' => $saleDate,
                    'notes' => 'Seeded demo sale.',
                    'created_by' => $userId,
                ]);
                $saleIds[$receipt] = $saleId;

                foreach ($items as [$sku, $itemQuantity, $price]) {
                    $product = collect($products)->firstWhere(1, $sku);
                    $buyingPrice = $product[7];
                    $upsert('sale_items', ['sale_id' => $saleId, 'product_id' => $productIds[$sku]], [
                        'product_name' => $product[0],
                        'quantity' => $itemQuantity,
                        'buying_price' => $buyingPrice,
                        'selling_price' => $price,
                        'discount' => 0,
                        'profit' => ($price - $buyingPrice) * $itemQuantity,
                        'total' => $price * $itemQuantity,
                    ]);
                }
            }

            foreach ([
                ['Shop rent', 'RENT', 350000, 'BANK', -25],
                ['Internet bundle', 'INTERNET', 65000, 'MOBILE_MONEY', -15],
                ['Local delivery transport', 'TRANSPORT', 45000, 'CASH', -9],
                ['Social media promotion', 'MARKETING', 80000, 'MOBILE_MONEY', -5],
                ['Electricity token', 'ELECTRICITY', 120000, 'MOBILE_MONEY', -2],
            ] as [$description, $category, $amount, $method, $daysAgo]) {
                $upsert('expenses', ['business_id' => $businessId, 'description' => $description], [
                    'branch_id' => $branchId,
                    'category' => $category,
                    'amount' => $amount,
                    'payment_method' => $method,
                    'expense_date' => $now->copy()->addDays($daysAgo)->toDateString(),
                    'notes' => 'Seeded demo expense.',
                ]);
            }

            $purchaseId = $upsert('purchase_orders', ['order_number' => 'PO-DEMO-0001'], [
                'business_id' => $businessId,
                'branch_id' => $branchId,
                'supplier_id' => $supplierIds['Dar Wholesale Traders'],
                'total_amount' => 555000,
                'paid_amount' => 405000,
                'status' => 'RECEIVED',
                'expected_date' => $now->copy()->subDays(18)->toDateString(),
                'received_date' => $now->copy()->subDays(17)->toDateString(),
                'notes' => 'Seeded demo purchase order.',
                'created_by' => $userId,
            ]);

            foreach ([
                ['RICE-5KG', 30, 12000],
                ['OIL-1L', 30, 4500],
                ['SUGAR-1KG', 25, 2400],
            ] as [$sku, $quantity, $unitPrice]) {
                $product = collect($products)->firstWhere(1, $sku);
                $upsert('purchase_order_items', ['purchase_order_id' => $purchaseId, 'product_id' => $productIds[$sku]], [
                    'product_name' => $product[0],
                    'quantity' => $quantity,
                    'received_quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'total_price' => $quantity * $unitPrice,
                ]);
            }

            $customerDebtId = $upsert('debts', ['business_id' => $businessId, 'debt_number' => 'DEBT-DEMO-0001'], [
                'branch_id' => $branchId,
                'type' => 'CUSTOMER',
                'customer_id' => $customerIds['Asha Mushi'],
                'supplier_id' => null,
                'sale_id' => $saleIds['BT-DEMO-0003'],
                'purchase_order_id' => null,
                'source' => 'AUTO_SALE',
                'original_amount' => 78000,
                'total_paid' => 0,
                'outstanding_balance' => 78000,
                'debt_date' => $now->copy()->subDays(8)->toDateString(),
                'due_date' => $now->copy()->addDays(6)->toDateString(),
                'description' => 'Balance due from credit sale BT-DEMO-0003.',
                'notes' => 'Seeded active customer debt.',
                'status' => 'ACTIVE',
                'created_by' => $userId,
            ]);

            $supplierDebtId = $upsert('debts', ['business_id' => $businessId, 'debt_number' => 'DEBT-DEMO-0002'], [
                'branch_id' => $branchId,
                'type' => 'SUPPLIER',
                'customer_id' => null,
                'supplier_id' => $supplierIds['Dar Wholesale Traders'],
                'sale_id' => null,
                'purchase_order_id' => $purchaseId,
                'source' => 'AUTO_PURCHASE',
                'original_amount' => 150000,
                'total_paid' => 50000,
                'outstanding_balance' => 100000,
                'debt_date' => $now->copy()->subDays(17)->toDateString(),
                'due_date' => $now->copy()->subDays(3)->toDateString(),
                'description' => 'Outstanding balance on purchase PO-DEMO-0001.',
                'notes' => 'Seeded overdue supplier debt.',
                'status' => 'PARTIALLY_PAID',
                'created_by' => $userId,
            ]);

            $upsert('debt_payments', ['business_id' => $businessId, 'debt_id' => $supplierDebtId, 'transaction_reference' => 'DEMO-PAY-001'], [
                'amount' => 50000,
                'payment_date' => $now->copy()->subDays(10)->toDateString(),
                'payment_method' => 'BANK',
                'notes' => 'Seeded supplier debt payment.',
                'recorded_by' => $userId,
                'reversed_at' => null,
                'reversed_by' => null,
                'reversal_reason' => null,
            ]);

            $upsert('debt_settings', ['business_id' => $businessId], [
                'allow_overpayments' => false,
                'remind_days_before' => json_encode([7, 3, 1]),
                'remind_on_due_date' => true,
                'remind_after_due_repeat_days' => 7,
                'remind_after_due_max_times' => 3,
                'enabled_channels' => json_encode(['EMAIL', 'IN_APP']),
            ]);

            foreach (['BEFORE_DUE', 'ON_DUE', 'AFTER_DUE_RECURRING'] as $trigger) {
                $upsert('debt_reminder_templates', [
                    'business_id' => $businessId,
                    'channel' => 'IN_APP',
                    'trigger_type' => $trigger,
                ], [
                    'subject' => 'BizTrack payment reminder',
                    'body' => 'Hello {{customer_name}}, this is a reminder that TZS {{outstanding_balance}} is due on {{due_date}}.',
                    'is_active' => true,
                ]);
            }

            foreach ([
                ['Low stock: Sugar 1kg', 'Sugar 1kg has reached its reorder level.', 'LOW_STOCK', $productIds['SUGAR-1KG']],
                ['Low stock: Dishwashing Liquid', 'Dishwashing Liquid has fallen below its reorder level.', 'LOW_STOCK', $productIds['DISH-500']],
            ] as [$title, $message, $type, $referenceId]) {
                $upsert('inventory_notifications', ['business_id' => $businessId, 'user_id' => $userId, 'title' => $title], [
                    'message' => $message,
                    'type' => $type,
                    'reference_id' => $referenceId,
                    'is_read' => false,
                ]);
            }

            $this->command?->info("Demo account ready: {$demoEmail} / {$demoPassword}");
            $this->command?->info("Demo business ready with ID: {$businessId}");
            $this->command?->info("Customer debt ready with ID: {$customerDebtId}");
        });
    }
}
