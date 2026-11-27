<?php

namespace App\Services\LearningPaths;

use App\Models\LearningPath;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

/**
 * Loads a path's module → topic → subtopic tree with the user's progress in 3 queries
 * (modules, topics, progress), then nests subtopics in memory.
 */
class LearningPathTree
{
    public function load(LearningPath $path, User $user): LearningPath
    {
        $path->load([
            'modules.topics.progress' => fn ($query) => $query->where('user_id', $user->id),
        ]);

        foreach ($path->modules as $module) {
            $byParent = $module->topics->groupBy(fn (Topic $topic) => $topic->parent_id ?? 0);

            $topLevel = new Collection($byParent->get(0, [])->all());
            foreach ($topLevel as $topic) {
                $topic->setRelation('children', new Collection($byParent->get($topic->id, collect())->all()));
            }

            $module->setRelation('topics', $topLevel);
        }

        return $path;
    }
}
