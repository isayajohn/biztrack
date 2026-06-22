<?php

namespace Database\Seeders;

use App\Models\LandingPageContent;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LandingPageContentSeeder extends Seeder
{
    public function run(): void
    {
        $content = LandingPageContent::first();

        $defaults = [
            // Hero
            'hero_title' => 'Simple sales and expense tracking for growing businesses',
            'hero_subtitle' => 'Track sales, expenses, products, inventory, and profit from one easy dashboard built for small business owners.',
            'hero_kicker' => 'Built for small businesses',
            'primary_button_text' => 'Get Started Free',
            'primary_button_url' => '/register',
            'secondary_button_text' => 'View Demo',
            'secondary_button_url' => '#dashboard-preview',
            'hero_trust_text' => 'No accounting knowledge needed. Works on phone, tablet, and desktop.',
            'hero_trust_indicators' => [
                ['label' => 'Easy to use'],
                ['label' => 'Mobile friendly'],
                ['label' => 'Secure business data'],
            ],

            // Problem section
            'problem_section' => [
                'eyebrow' => 'Sound familiar?',
                'title' => 'Running a business blind is stressful',
                'description' => 'Most small business owners face the same problems every day. BizTrack solves all of them in one place.',
                'items' => [
                    ['quote' => "I don't know if I made profit today", 'detail' => "Without tracking, it's impossible to tell if your business is actually growing."],
                    ['quote' => 'I forget expenses', 'detail' => 'Small costs add up fast. Forgetting them means you never see the real picture.'],
                    ['quote' => 'I lose sales records', 'detail' => 'Paper records get lost, damaged, or forgotten. Your data should be safe and searchable.'],
                    ['quote' => "I don't know when stock is low", 'detail' => "Running out of products means losing customers — and you might not even notice until it's too late."],
                ],
            ],

            // Solution section
            'solution_section' => [
                'eyebrow' => 'The solution',
                'title' => 'BizTrack gives you the full picture.',
                'description' => 'In under a minute a day, know exactly where your business stands: sales, expenses, stock, and profit, all in one place.',
                'rows' => [
                    [
                        'eyebrow' => 'Money in',
                        'title' => 'Know exactly what you earned today.',
                        'description' => 'Record every sale in seconds from your phone. See today\'s total, your best-selling products, and how this week compares to last — all without touching a spreadsheet.',
                        'bullets' => ['One-tap sale recording', 'Daily and weekly totals at a glance', 'See top-selling products instantly'],
                    ],
                    [
                        'eyebrow' => 'Money out',
                        'title' => 'Every expense, in one place.',
                        'description' => 'Stop forgetting small costs that eat your profit. BizTrack lets you log rent, transport, supplies, and any other expense in seconds so the real picture is always visible.',
                        'bullets' => ['Categorised expense logging', 'Monthly expense summaries', "See what's eating your profit"],
                    ],
                    [
                        'eyebrow' => 'Stock & reports',
                        'title' => 'Never run out of stock unexpectedly.',
                        'description' => 'Add your products, set stock quantities, and let BizTrack watch them for you. Get low-stock alerts and monthly profit reports so you can make smarter buying decisions.',
                        'bullets' => ['Track stock levels automatically as you sell', 'Low-stock alerts before you run out', 'Monthly profit and product reports'],
                    ],
                ],
            ],

            // Features section
            'features_eyebrow' => 'Everything you need',
            'features_title' => 'Powerful features, simple enough for anyone',
            'features_description' => 'BizTrack packs everything a small business owner needs into a clean, easy-to-use interface.',
            'features' => [
                ['title' => 'Sales Tracking', 'description' => 'Record every sale in seconds. Know exactly what sold, when, and for how much — all in one searchable history.', 'iconName' => 'ReceiptText', 'imageUrl' => ''],
                ['title' => 'Expense Tracking', 'description' => 'Log rent, transport, stock purchases, and any other cost. Never lose an expense record again.', 'iconName' => 'WalletCards', 'imageUrl' => ''],
                ['title' => 'Product & Stock Management', 'description' => 'Add your products, set quantities, and get alerts when stock runs low before you miss a sale.', 'iconName' => 'Boxes', 'imageUrl' => ''],
                ['title' => 'Daily Profit Dashboard', 'description' => 'See your net profit at a glance every day. No spreadsheets, no mental math — just clear numbers.', 'iconName' => 'BarChart3', 'imageUrl' => ''],
                ['title' => 'Simple Business Reports', 'description' => 'Weekly and monthly summaries of your sales, expenses, and top-performing products in plain language.', 'iconName' => 'FileText', 'imageUrl' => ''],
                ['title' => 'Mobile-Friendly Design', 'description' => 'Built for phones first. Use BizTrack on your Android or iPhone with no downloads required.', 'iconName' => 'Smartphone', 'imageUrl' => ''],
            ],

            // How it works
            'how_it_works' => [
                'eyebrow' => 'How it works',
                'title' => 'Up and running in minutes',
                'description' => 'No training needed. BizTrack is designed to be simple enough that anyone can start using it immediately.',
                'steps' => [
                    ['number' => '01', 'title' => 'Add your products', 'description' => 'Set up your product catalogue with names, prices, and stock quantities. Takes less than 5 minutes to get going.'],
                    ['number' => '02', 'title' => 'Record sales and expenses', 'description' => 'Tap to record every sale and expense throughout the day. Quick, simple, and works on any device.'],
                    ['number' => '03', 'title' => 'See your profit instantly', 'description' => 'BizTrack calculates your profit in real time. Know exactly how your business performed — every day.'],
                ],
            ],

            // Pricing section
            'pricing_eyebrow' => 'Pricing',
            'pricing_title' => 'Start free, scale when you\'re ready',
            'pricing_description' => 'No hidden fees. No contracts. Cancel anytime.',
            'pricing' => [],

            // Testimonials
            'testimonials_eyebrow' => 'Real stories',
            'testimonials_title' => 'What business owners say.',
            'testimonials_description' => '',
            'testimonials' => [
                ['name' => 'Amara Nwosu', 'role' => 'Owner', 'business' => "Amara's Provisions Store", 'message' => 'Before BizTrack I had no idea how much profit I was actually making. Now I check my dashboard every morning like a routine. It\'s completely changed how I manage my shop.', 'avatarUrl' => ''],
                ['name' => 'Kwame Asante', 'role' => 'Freelancer', 'business' => 'Kwame Phone Repairs', 'message' => 'I used to write repairs and parts in a notebook and lose pages. BizTrack made everything digital and I can see exactly which job type makes me the most money.', 'avatarUrl' => ''],
                ['name' => 'Fatima Al-Hassan', 'role' => 'Founder', 'business' => "Fatima's Food Corner", 'message' => 'Tracking food sales used to be impossible. BizTrack is so fast — I record a sale in 3 seconds and at the end of the day I see my real profit. No guessing anymore.', 'avatarUrl' => ''],
                ['name' => 'Carlos Mendes', 'role' => 'Owner', 'business' => 'Carlos Fresh Produce', 'message' => 'The stock alerts alone are worth it. I used to run out of tomatoes and not notice until customers complained. Now I get a warning before it happens.', 'avatarUrl' => ''],
                ['name' => 'Priya Sharma', 'role' => 'Owner', 'business' => 'Priya Tailoring & Alterations', 'message' => 'I was nervous about using any software but BizTrack is so simple. No accounting needed. The profit number is always right there on my screen.', 'avatarUrl' => ''],
                ['name' => 'Emmanuel Okafor', 'role' => 'Farmer', 'business' => 'Okafor Farm Supplies', 'message' => 'I sell at three different markets and used to lose track of expenses. BizTrack keeps everything organised and the weekly report tells me which market is most profitable.', 'avatarUrl' => ''],
            ],

            // FAQ section
            'faq_eyebrow' => 'FAQ',
            'faq_title' => 'Frequently asked questions',
            'faq_description' => 'Search common questions about using BizTrack for sales, expenses, stock, reports, and daily profit tracking.',
            'faqs' => [
                ['question' => 'Is BizTrack free?', 'answer' => 'Yes! BizTrack has a free plan that includes sales tracking, expense tracking, and a basic dashboard — with no time limit. You only upgrade if you need advanced features like inventory alerts, PDF reports, or multi-user access.'],
                ['question' => 'Can I use it on my phone?', 'answer' => 'Absolutely. BizTrack is mobile-first and works great on any smartphone browser — no app download needed. It\'s designed to be fast and easy to use with one hand while serving customers.'],
                ['question' => 'Can I track stock?', 'answer' => 'Yes. You can add your products with quantities, and BizTrack will track stock levels as you record sales. Low-stock alerts are available on the Pro and Business plans.'],
                ['question' => 'Can I export reports?', 'answer' => 'PDF report exports are available on the Pro and Business plans. You can download weekly or monthly summaries of your sales, expenses, and profit to share or keep for your records.'],
                ['question' => 'Do I need accounting knowledge?', 'answer' => 'Not at all. BizTrack is built for everyday business owners — not accountants. Everything is explained in plain language, and the dashboard gives you all the numbers you need without any jargon.'],
            ],

            // Final CTA
            'final_cta_kicker' => 'Free forever on the basic plan',
            'final_cta_title' => 'Start tracking your business today',
            'final_cta_description' => 'Join thousands of small business owners who use BizTrack to understand their numbers and grow with confidence.',

            // Footer
            'footer_links' => [
                ['label' => 'Email', 'value' => 'support@biztrack.co', 'href' => 'mailto:support@biztrack.co'],
                ['label' => 'Phone', 'value' => '+255 700 000 000', 'href' => 'tel:+255700000000'],
                ['label' => 'Location', 'value' => 'Dar es Salaam, Tanzania', 'href' => '#'],
            ],
            'footer_tagline' => 'Simple sales and expense tracking for small businesses. Know your numbers, grow your business.',
            'footer_badge' => 'Free to get started',
            'footer_product_links' => [
                ['label' => 'Features', 'href' => '#features'],
                ['label' => 'How It Works', 'href' => '#how-it-works'],
                ['label' => 'Pricing', 'href' => '#pricing'],
                ['label' => 'FAQ', 'href' => '#faq'],
                ['label' => 'View Demo', 'href' => '/demo'],
            ],
            'footer_company_links' => [
                ['label' => 'About', 'href' => '#'],
                ['label' => 'Blog', 'href' => '#'],
                ['label' => 'Careers', 'href' => '#'],
                ['label' => 'Contact', 'href' => '#contact'],
            ],

            // SEO
            'seo_title' => 'BizTrack | Sales, expenses, stock, and profit tracking',
            'seo_description' => 'BizTrack helps small business owners track sales, expenses, stock, and profit from one simple dashboard.',

            'is_published' => true,
        ];

        if (!$content) {
            LandingPageContent::create(array_merge(['id' => (string) Str::uuid()], $defaults));
            return;
        }

        // Only fill columns that are currently null or empty so we don't overwrite admin edits.
        $updates = [];
        foreach ($defaults as $column => $value) {
            $current = $content->$column;
            $isEmpty = $current === null
                || $current === ''
                || (is_array($current) && empty($current));

            if ($isEmpty) {
                $updates[$column] = $value;
            }
        }

        if (!empty($updates)) {
            $content->update($updates);
        }
    }
}
