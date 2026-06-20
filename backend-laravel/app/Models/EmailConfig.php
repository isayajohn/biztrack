<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class EmailConfig extends Model
{
    use HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['provider', 'host', 'port', 'username', 'password_encrypted', 'api_key_encrypted', 'from_name', 'from_email', 'reply_to_email', 'is_active'];

    protected $hidden = ['password_encrypted', 'api_key_encrypted'];

    protected $casts = ['is_active' => 'boolean'];
}
