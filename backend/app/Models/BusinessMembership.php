<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
class BusinessMembership extends Model
{
    use HasUuids;
    protected $fillable = ['business_id', 'user_id', 'branch_id', 'role', 'permissions', 'status'];
    protected $casts = ['permissions' => 'array'];
    public function user() { return $this->belongsTo(User::class); }
    public function branch() { return $this->belongsTo(Branch::class); }
    public function hasPermission(string $permission): bool { $permissions = $this->permissions ?? []; return $this->role === 'OWNER' || in_array('*', $permissions, true) || in_array($permission, $permissions, true); }
}
