<?php

namespace App\Services\LearningPaths;

use App\Enums\TopicStatus;
use App\Models\Topic;
use App\Models\User;
use App\Models\UserTopicProgress;

/**
 * Manual status changes. Mastery is computed separately (Phase 6) and never set here.
 */
class TopicProgressService
{
    public function setStatus(User $user, Topic $topic, TopicStatus $status): UserTopicProgress
    {
        // createOrFirst survives concurrent first writes (double-click, two tabs) via the unique (user_id, topic_id) key.
        $progress = UserTopicProgress::createOrFirst(['user_id' => $user->id, 'topic_id' => $topic->id]);

        $progress->status = $status;
        $progress->last_studied_at = now();
        $progress->completed_at = $status === TopicStatus::Completed ? ($progress->completed_at ?? now()) : null;
        $progress->save();

        return $progress;
    }
}
