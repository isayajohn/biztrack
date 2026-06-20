<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;

class JwtMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            if (!$user) {
                return response()->json(['success' => false, 'error' => 'Unauthorized'], 401);
            }
            if ($user->status !== 'ACTIVE') {
                return response()->json(['success' => false, 'error' => 'Account suspended'], 403);
            }
            auth()->setUser($user);
        } catch (TokenExpiredException $e) {
            return response()->json(['success' => false, 'error' => 'Token expired'], 401);
        } catch (TokenInvalidException $e) {
            return response()->json(['success' => false, 'error' => 'Token invalid'], 401);
        } catch (JWTException $e) {
            return response()->json(['success' => false, 'error' => 'Token absent'], 401);
        }

        return $next($request);
    }
}
