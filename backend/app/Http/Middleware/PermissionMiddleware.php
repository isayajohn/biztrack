<?php
namespace App\Http\Middleware;
use App\Models\Business;
use Closure;
use Illuminate\Http\Request;
class PermissionMiddleware
{
    public function handle(Request $request,Closure $next,string $permission){$user=auth()->user();if($user?->isSuperAdmin())return $next($request);$business=Business::forUser($user);if(!$business)return response()->json(['success'=>false,'error'=>'Business access required'],403);if($business->user_id===$user->id)return $next($request);$membership=$business->memberships()->where('user_id',$user->id)->where('status','ACTIVE')->first();if(!$membership||!$membership->hasPermission($permission))return response()->json(['success'=>false,'error'=>'You do not have permission to perform this action'],403);return $next($request);}
}
