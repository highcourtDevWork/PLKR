<?php

namespace App\Policies;

use App\Models\LearningResource;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/** Resources are private to their owner, even on system topics. */
class LearningResourcePolicy
{
    public function update(User $user, LearningResource $resource): Response
    {
        return $resource->user_id === $user->id ? Response::allow() : Response::denyAsNotFound();
    }

    public function delete(User $user, LearningResource $resource): Response
    {
        return $this->update($user, $resource);
    }
}
