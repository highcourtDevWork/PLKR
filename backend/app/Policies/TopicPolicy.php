<?php

namespace App\Policies;

use App\Models\Topic;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TopicPolicy
{
    public function __construct(private LearningPathPolicy $paths) {}

    /** Viewing also allows tracking progress and attaching your own resources. */
    public function view(User $user, Topic $topic): Response
    {
        return $this->paths->view($user, $topic->module->learningPath);
    }

    public function update(User $user, Topic $topic): Response
    {
        return $this->paths->update($user, $topic->module->learningPath);
    }

    public function delete(User $user, Topic $topic): Response
    {
        return $this->paths->update($user, $topic->module->learningPath);
    }
}
