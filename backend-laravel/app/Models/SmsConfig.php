<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SmsConfig extends Model
{
    use HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['provider', 'base_url', 'api_key_encrypted', 'api_secret_encrypted', 'sender_id', 'is_active'];

    protected $hidden = ['api_key_encrypted', 'api_secret_encrypted'];

    protected $casts = ['is_active' => 'boolean'];
}
