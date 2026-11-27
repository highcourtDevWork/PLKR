<?php

use App\Http\Controllers\Api\V1\Me\MeController;
use App\Http\Controllers\Api\V1\Me\SettingsController;
use Illuminate\Support\Facades\Route;

// Auth endpoints (login, logout, register, password reset/update, profile) are registered by Fortify under /api/v1/auth.

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    Route::get('me', [MeController::class, 'show']);
    Route::delete('me', [MeController::class, 'destroy']);
    Route::patch('me/settings', [SettingsController::class, 'update']);
});
