<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryNotification extends Model
{
    protected $table = 'inventory_notifications';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'business_id',
        'user_id',
        'title',
        'message',
        'type',
        'reference_id',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];
}
