<?php

namespace App\Models\Concerns;

use App\Models\Tag;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

/**
 * The user's tags on a piece of content. taggables has no FK to the tagged row,
 * so the links are removed when the row is force-deleted (soft deletes keep them for a restore).
 */
trait HasTags
{
    public static function bootHasTags(): void
    {
        static::forceDeleted(fn (self $model) => $model->tags()->detach());
    }

    /** @return MorphToMany<Tag, $this> */
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable')->orderBy('name');
    }
}
