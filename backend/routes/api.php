<?php

use App\Http\Controllers\Api\V1\LearningPaths\LearningPathController;
use App\Http\Controllers\Api\V1\LearningPaths\ModuleController;
use App\Http\Controllers\Api\V1\LearningPaths\ResourceController;
use App\Http\Controllers\Api\V1\LearningPaths\TopicController;
use App\Http\Controllers\Api\V1\LearningPaths\TopicProgressController;
use App\Http\Controllers\Api\V1\Me\MeController;
use App\Http\Controllers\Api\V1\Me\SettingsController;
use App\Http\Controllers\Api\V1\Notes\NoteController;
use App\Http\Controllers\Api\V1\Notes\TagController;
use App\Http\Controllers\Api\V1\SearchController;
use Illuminate\Support\Facades\Route;

// Auth endpoints (login, logout, register, password reset/update, profile) are registered by Fortify under /api/v1/auth.

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    Route::get('me', [MeController::class, 'show']);
    Route::delete('me', [MeController::class, 'destroy']);
    Route::patch('me/settings', [SettingsController::class, 'update']);

    // Learning paths → modules → topics → resources (docs/api/learning-paths.md)
    Route::post('learning-paths/reorder', [LearningPathController::class, 'reorder']);
    Route::apiResource('learning-paths', LearningPathController::class)
        ->parameters(['learning-paths' => 'learningPath'])
        ->except('update');
    Route::patch('learning-paths/{learningPath}', [LearningPathController::class, 'update']); // PATCH only, like every other update

    Route::post('learning-paths/{learningPath}/modules', [ModuleController::class, 'store']);
    Route::post('learning-paths/{learningPath}/modules/reorder', [ModuleController::class, 'reorder']);
    Route::patch('modules/{module}', [ModuleController::class, 'update']);
    Route::delete('modules/{module}', [ModuleController::class, 'destroy']);

    Route::post('modules/{module}/topics', [TopicController::class, 'store']);
    Route::post('modules/{module}/topics/reorder', [TopicController::class, 'reorder']);
    Route::get('topics/{topic}', [TopicController::class, 'show']);
    Route::patch('topics/{topic}', [TopicController::class, 'update']);
    Route::delete('topics/{topic}', [TopicController::class, 'destroy']);
    Route::put('topics/{topic}/progress', [TopicProgressController::class, 'update']);

    Route::get('topics/{topic}/resources', [ResourceController::class, 'index']);
    Route::post('topics/{topic}/resources', [ResourceController::class, 'store']);
    Route::patch('resources/{resource}', [ResourceController::class, 'update']);
    Route::delete('resources/{resource}', [ResourceController::class, 'destroy']);

    // Knowledge base (docs/api/notes.md)
    Route::apiResource('notes', NoteController::class)->except('update');
    Route::patch('notes/{note}', [NoteController::class, 'update']);
    Route::apiResource('tags', TagController::class)->except(['show', 'update']);
    Route::patch('tags/{tag}', [TagController::class, 'update']);
    Route::get('search', SearchController::class);
});
