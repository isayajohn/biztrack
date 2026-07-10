<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class LandingPageContent extends Model
{
    use HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'hero_title', 'hero_subtitle', 'hero_kicker', 'primary_button_text', 'primary_button_url',
        'secondary_button_text', 'secondary_button_url', 'hero_trust_text', 'hero_image_url',
        'features_eyebrow', 'features_title', 'features_description',
        'pricing_eyebrow', 'pricing_title', 'pricing_description',
        'testimonials_eyebrow', 'testimonials_title', 'testimonials_description',
        'faq_eyebrow', 'faq_title', 'faq_description',
        'final_cta_kicker', 'final_cta_title', 'final_cta_description',
        'features', 'pricing', 'faqs', 'testimonials', 'footer_links',
        'hero_trust_indicators',
        'footer_tagline', 'footer_badge', 'footer_product_links', 'footer_company_links',
        'problem_section', 'solution_section', 'how_it_works',
        'mobile_app_title', 'mobile_app_description', 'android_app_url', 'ios_app_url',
        'apk_path', 'apk_file_name',
        'seo_title', 'seo_description', 'is_published',
    ];

    protected $casts = [
        'features' => 'array',
        'pricing' => 'array',
        'faqs' => 'array',
        'testimonials' => 'array',
        'footer_links' => 'array',
        'hero_trust_indicators' => 'array',
        'footer_product_links' => 'array',
        'footer_company_links' => 'array',
        'problem_section' => 'array',
        'solution_section' => 'array',
        'how_it_works' => 'array',
        'is_published' => 'boolean',
    ];
}
