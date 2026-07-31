<?php

use Illuminate\Support\Facades\Route;

Route::get('/{path?}', function () {
    $frontend = public_path('index.html');

    if (is_file($frontend)) {
        return response()->file($frontend);
    }

    return view('welcome');
})->where('path', '^(?!api(?:/|$)).*');
