<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable([
    'name', 'email', 'password',
    'timezone', 'desired_retention', 'daily_new_limit', 'daily_review_limit', 'ai_use_notes_context', 'settings',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Mirrors the column defaults so a freshly created model (e.g. right after registration) has them in memory.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'timezone' => 'UTC',
        'desired_retention' => 0.90,
        'daily_new_limit' => 20,
        'daily_review_limit' => 200,
        'ai_use_notes_context' => true,
        'settings' => null,
    ];

    /** @return HasMany<LearningPath, $this> */
    public function learningPaths(): HasMany
    {
        return $this->hasMany(LearningPath::class);
    }

    /** @return HasMany<LearningResource, $this> */
    public function resources(): HasMany
    {
        return $this->hasMany(LearningResource::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'desired_retention' => 'float',
            'daily_new_limit' => 'integer',
            'daily_review_limit' => 'integer',
            'ai_use_notes_context' => 'boolean',
            'settings' => 'array',
        ];
    }
}
