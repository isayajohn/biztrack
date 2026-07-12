<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
class Branch extends Model { use HasUuids; protected $fillable = ['business_id', 'name', 'code', 'phone', 'address', 'is_default', 'is_active']; protected $casts = ['is_default' => 'boolean', 'is_active' => 'boolean']; public function memberships(){return $this->hasMany(BusinessMembership::class);} }
