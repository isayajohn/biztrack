<?php

use Illuminate\Support\Facades\Route;

Route::get('/{path?}', function () {
    $frontend = public_path('index.html');

    if (is_file($frontend)) {
        return response()->file($frontend, [
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    return view('welcome');
})->where('path', '^(?!api(?:/|$)).*');
