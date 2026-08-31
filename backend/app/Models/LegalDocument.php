<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class LegalDocument extends Model
{
    use HasUuids;

    protected $fillable = [
        'type', 'title', 'version', 'effective_date', 'summary', 'sections', 'published_at',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'sections' => 'array',
        'published_at' => 'datetime',
    ];

    public function scopePublished($query)
    {
        return $query->whereNotNull('published_at')->where('published_at', '<=', now());
    }
}
