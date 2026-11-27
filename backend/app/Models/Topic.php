<?php

namespace App\Models;

use App\Enums\Level;
use Database\Factories\TopicFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A topic, or a subtopic when parent_id is set. Depth is limited to 2.
 */
#[Fillable(['title', 'summary', 'level', 'estimated_minutes', 'position'])]
class Topic extends Model
{
    /** @use HasFactory<TopicFactory> */
    use HasFactory, SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'level' => Level::class,
            'estimated_minutes' => 'integer',
            'position' => 'integer',
        ];
    }

    /** @return BelongsTo<Module, $this> */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    /** @return BelongsTo<Topic, $this> */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Topic::class, 'parent_id');
    }

    /** @return HasMany<Topic, $this> */
    public function children(): HasMany
    {
        return $this->hasMany(Topic::class, 'parent_id')->orderBy('position');
    }

    /** @return HasMany<LearningResource, $this> */
    public function resources(): HasMany
    {
        return $this->hasMany(LearningResource::class)->orderBy('position');
    }

    /**
     * Progress row. Always constrain it to one user when loading.
     *
     * @return HasOne<UserTopicProgress, $this>
     */
    public function progress(): HasOne
    {
        return $this->hasOne(UserTopicProgress::class);
    }

    public function isSubtopic(): bool
    {
        return $this->parent_id !== null;
    }
}
