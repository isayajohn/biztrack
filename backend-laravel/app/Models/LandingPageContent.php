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
        'hero_title', 'hero_subtitle', 'primary_button_text', 'primary_button_url',
        'secondary_button_text', 'secondary_button_url', 'features', 'pricing', 'faqs',
        'testimonials', 'footer_links', 'seo_title', 'seo_description', 'is_published',
    ];

    protected $casts = [
        'features' => 'array',
        'pricing' => 'array',
        'faqs' => 'array',
        'testimonials' => 'array',
        'footer_links' => 'array',
        'is_published' => 'boolean',
    ];
}
