<?php

namespace App\Http\Controllers;

use App\Models\LandingPageContent;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class SpaController extends Controller
{
    private const SITE_URL = 'https://biztracktanzania.online';
    private const SITE_NAME = 'BizTrack';
    private const OG_IMAGE = self::SITE_URL.'/landing-dashboard.png';

    public function __invoke(?string $path = null): Response
    {
        $frontend = public_path('index.html');
        if (!is_file($frontend)) {
            return response()->view('welcome');
        }

        $route = '/'.trim((string) $path, '/');
        if ($route === '/') {
            $route = '/';
        }

        $seo = $this->seoFor($route);
        $html = file_get_contents($frontend);
        $head = $this->renderHead($seo);
        $html = preg_replace(
            '/<!-- SEO:START -->.*?<!-- SEO:END -->/s',
            "<!-- SEO:START -->\n{$head}\n    <!-- SEO:END -->",
            $html,
            1,
        ) ?? $html;

        $response = response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
            'Content-Language' => 'en',
        ]);

        if ($seo['index']) {
            $response->headers->set('Link', '<'.$seo['canonical'].'>; rel="canonical"');
        } else {
            $response->headers->set('X-Robots-Tag', 'noindex, nofollow');
        }

        return $response;
    }

    private function seoFor(string $route): array
    {
        if ($route === '/') {
            $content = LandingPageContent::where('is_published', true)->first();
            $title = $this->clean($content?->seo_title)
                ?: 'BizTrack Tanzania | POS, inventory and business management';
            $description = $this->clean($content?->seo_description)
                ?: 'Manage sales, POS, inventory, expenses, customers, debts, branches and reports with BizTrack, built in Tanzania for growing African businesses.';

            return $this->indexed($route, $title, $description, $this->homeSchema($description));
        }

        if ($route === '/about') {
            $description = 'Meet BizTrack, the AfrigoTech business platform built in Tanzania to help African businesses manage sales, inventory, finance and reporting with confidence.';
            return $this->indexed(
                $route,
                'About BizTrack | Business software built in Tanzania',
                $description,
                $this->aboutSchema($description),
            );
        }

        if ($route === '/demo') {
            $description = 'Explore a live BizTrack dashboard preview for sales, expenses, stock and profit tracking for small and growing businesses.';
            return $this->indexed(
                $route,
                'BizTrack Demo | Preview sales, stock and profit tracking',
                $description,
                $this->demoSchema($description),
            );
        }

        $utilityTitles = [
            '/login' => 'Sign in | BizTrack',
            '/auth' => 'Sign in | BizTrack',
            '/register' => 'Create an account | BizTrack',
            '/forgot-password' => 'Reset your password | BizTrack',
            '/verify-account' => 'Verify your account | BizTrack',
            '/verify-email' => 'Verify your email | BizTrack',
            '/verify-phone' => 'Verify your phone | BizTrack',
        ];

        return [
            'title' => $utilityTitles[$route] ?? 'BizTrack Business Management',
            'description' => 'Secure BizTrack account and business management workspace.',
            'canonical' => self::SITE_URL.$route,
            'index' => false,
            'schema' => [],
        ];
    }

    private function indexed(string $route, string $title, string $description, array $schema): array
    {
        return [
            'title' => $title,
            'description' => $description,
            'canonical' => self::SITE_URL.($route === '/' ? '/' : $route),
            'index' => true,
            'schema' => $schema,
        ];
    }

    private function renderHead(array $seo): string
    {
        $title = e($seo['title']);
        $description = e($seo['description']);
        $robots = $seo['index'] ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' : 'noindex, nofollow';
        $tags = [
            '    <title>'.$title.'</title>',
            '    <meta name="description" content="'.$description.'" />',
            '    <meta name="robots" content="'.$robots.'" />',
            '    <meta name="googlebot" content="'.$robots.'" />',
            '    <meta name="bingbot" content="'.$robots.'" />',
        ];

        if ($seo['index']) {
            $canonical = e($seo['canonical']);
            $image = e(self::OG_IMAGE);
            array_push($tags,
                '    <link rel="canonical" href="'.$canonical.'" />',
                '    <meta property="og:locale" content="en_TZ" />',
                '    <meta property="og:type" content="website" />',
                '    <meta property="og:site_name" content="'.self::SITE_NAME.'" />',
                '    <meta property="og:title" content="'.$title.'" />',
                '    <meta property="og:description" content="'.$description.'" />',
                '    <meta property="og:url" content="'.$canonical.'" />',
                '    <meta property="og:image" content="'.$image.'" />',
                '    <meta property="og:image:secure_url" content="'.$image.'" />',
                '    <meta property="og:image:type" content="image/png" />',
                '    <meta property="og:image:width" content="2880" />',
                '    <meta property="og:image:height" content="1800" />',
                '    <meta property="og:image:alt" content="BizTrack business dashboard" />',
                '    <meta name="twitter:card" content="summary_large_image" />',
                '    <meta name="twitter:title" content="'.$title.'" />',
                '    <meta name="twitter:description" content="'.$description.'" />',
                '    <meta name="twitter:image" content="'.$image.'" />',
                '    <meta name="twitter:image:alt" content="BizTrack business dashboard" />',
            );

            $json = json_encode(
                ['@context' => 'https://schema.org', '@graph' => $seo['schema']],
                JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT,
            );
            $tags[] = '    <script id="seo-structured-data" type="application/ld+json">'.$json.'</script>';
        }

        return implode("\n", $tags);
    }

    private function homeSchema(string $description): array
    {
        return [
            $this->organizationSchema(),
            [
                '@type' => 'WebSite',
                '@id' => self::SITE_URL.'/#website',
                'url' => self::SITE_URL.'/',
                'name' => self::SITE_NAME,
                'description' => $description,
                'publisher' => ['@id' => self::SITE_URL.'/#organization'],
                'inLanguage' => ['en', 'sw'],
            ],
            $this->softwareSchema($description),
        ];
    }

    private function aboutSchema(string $description): array
    {
        return [
            $this->organizationSchema(),
            [
                '@type' => 'AboutPage',
                '@id' => self::SITE_URL.'/about#webpage',
                'url' => self::SITE_URL.'/about',
                'name' => 'About BizTrack',
                'description' => $description,
                'about' => ['@id' => self::SITE_URL.'/#organization'],
                'inLanguage' => 'en',
            ],
            $this->breadcrumbSchema('About', '/about'),
        ];
    }

    private function demoSchema(string $description): array
    {
        return [
            $this->softwareSchema($description),
            [
                '@type' => 'WebPage',
                '@id' => self::SITE_URL.'/demo#webpage',
                'url' => self::SITE_URL.'/demo',
                'name' => 'BizTrack product demo',
                'description' => $description,
                'about' => ['@id' => self::SITE_URL.'/#software'],
                'inLanguage' => 'en',
            ],
            $this->breadcrumbSchema('Demo', '/demo'),
        ];
    }

    private function organizationSchema(): array
    {
        return [
            '@type' => 'Organization',
            '@id' => self::SITE_URL.'/#organization',
            'name' => self::SITE_NAME,
            'url' => self::SITE_URL.'/',
            'logo' => [
                '@type' => 'ImageObject',
                'url' => self::SITE_URL.'/biztrack-wordmark-cyan.png',
                'width' => 1066,
                'height' => 205,
            ],
            'email' => 'info@afrigotech.com',
            'areaServed' => ['@type' => 'Country', 'name' => 'Tanzania'],
        ];
    }

    private function softwareSchema(string $description): array
    {
        return [
            '@type' => 'SoftwareApplication',
            '@id' => self::SITE_URL.'/#software',
            'name' => self::SITE_NAME,
            'url' => self::SITE_URL.'/',
            'description' => $description,
            'applicationCategory' => 'BusinessApplication',
            'applicationSubCategory' => 'Point of Sale and Inventory Management',
            'operatingSystem' => 'Web, Android',
            'publisher' => ['@id' => self::SITE_URL.'/#organization'],
            'image' => self::OG_IMAGE,
            'featureList' => [
                'Point of sale',
                'Sales and expense tracking',
                'Inventory management',
                'Customer and supplier debts',
                'Multi-branch access',
                'Business reports',
            ],
        ];
    }

    private function breadcrumbSchema(string $name, string $path): array
    {
        return [
            '@type' => 'BreadcrumbList',
            'itemListElement' => [
                ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => self::SITE_URL.'/'],
                ['@type' => 'ListItem', 'position' => 2, 'name' => $name, 'item' => self::SITE_URL.$path],
            ],
        ];
    }

    private function clean(?string $value): ?string
    {
        $value = trim(strip_tags((string) $value));
        return $value === '' ? null : Str::limit($value, 300, '');
    }
}
