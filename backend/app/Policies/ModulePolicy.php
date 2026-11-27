<?php

namespace App\Policies;

use App\Models\Module;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ModulePolicy
{
    public function __construct(private LearningPathPolicy $paths) {}

    public function update(User $user, Module $module): Response
    {
        return $this->paths->update($user, $module->learningPath);
    }

    public function delete(User $user, Module $module): Response
    {
        return $this->paths->update($user, $module->learningPath);
    }
}
