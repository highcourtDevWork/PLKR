<?php

namespace App\Models;

use App\Enums\TopicStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Per-user progress on a topic. Mastery, retention, accuracy and coverage are computed from Phase 6 on.
 *
 * @property TopicStatus $status
 * @property float $mastery
 * @property ?float $retention
 * @property ?float $accuracy
 * @property ?float $coverage
 * @property ?Carbon $last_studied_at
 * @property ?Carbon $completed_at
 */
#[Fillable(['user_id', 'topic_id', 'status', 'last_studied_at', 'completed_at'])]
class UserTopicProgress extends Model
{
    protected $table = 'user_topic_progress';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => TopicStatus::class,
            'mastery' => 'float',
            'retention' => 'float',
            'accuracy' => 'float',
            'coverage' => 'float',
            'last_studied_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Topic, $this> */
    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }
}
