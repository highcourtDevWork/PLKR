<?php

use Illuminate\Support\Facades\Route;

// LearnOS is API-only; the React app is served separately.
Route::get('/', fn () => response()->json(['name' => config('app.name'), 'api' => url('/api/v1')]));
