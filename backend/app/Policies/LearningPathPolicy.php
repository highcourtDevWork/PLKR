<?php

namespace App\Policies;

use App\Models\LearningPath;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * Own paths: full access. System paths: read-only (403 on write). Other users' paths: 404.
 * Modules and topics delegate here through their learning path.
 */
class LearningPathPolicy
{
    public function view(User $user, LearningPath $path): Response
    {
        return $path->isSystem() || $path->isOwnedBy($user)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    public function update(User $user, LearningPath $path): Response
    {
        if ($path->isOwnedBy($user)) {
            return Response::allow();
        }

        return $path->isSystem()
            ? Response::deny('Built-in learning paths are read-only.')
            : Response::denyAsNotFound();
    }

    public function delete(User $user, LearningPath $path): Response
    {
        return $this->update($user, $path);
    }
}
