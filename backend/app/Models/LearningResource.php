<?php

namespace App\Models;

use App\Enums\ResourceType;
use Database\Factories\LearningResourceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A link a user attaches to a topic. Always user-owned, also on system topics.
 * (Not named "Resource": that is a PHP pseudo-type and gets mangled in docblocks.)
 */
#[Fillable(['type', 'title', 'url', 'description', 'position'])]
class LearningResource extends Model
{
    /** @use HasFactory<LearningResourceFactory> */
    use HasFactory, SoftDeletes;

    protected $table = 'resources';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => ResourceType::class,
            'position' => 'integer',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Topic, $this> */
    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }
}
