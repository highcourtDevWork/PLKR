<?php

namespace App\Services\LearningPaths;

use App\Models\LearningPath;
use App\Models\LearningResource;
use App\Models\Module;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Creating (appended at the end), soft-deleting (with children) and reordering learning content.
 */
class LearningContentService
{
    /** @param array<string, mixed> $data */
    public function createPath(User $user, array $data): LearningPath
    {
        return $user->learningPaths()->create([
            ...$data,
            'position' => $this->nextPosition($user->learningPaths()->getQuery()),
        ]);
    }

    /** @param array<string, mixed> $data */
    public function createModule(LearningPath $path, array $data): Module
    {
        return $path->modules()->create([
            ...$data,
            'position' => $this->nextPosition(Module::where('learning_path_id', $path->id)),
        ]);
    }

    /** @param array<string, mixed> $data  May contain parent_id (validated to be a top-level topic of the module). */
    public function createTopic(Module $module, array $data): Topic
    {
        $parentId = $data['parent_id'] ?? null;
        unset($data['parent_id']);

        $topic = new Topic([
            ...$data,
            'position' => $this->nextPosition(Topic::where('module_id', $module->id)->where('parent_id', $parentId)),
        ]);
        $topic->module_id = $module->id;
        $topic->parent_id = $parentId;
        $topic->save();

        return $topic;
    }

    /** @param array<string, mixed> $data */
    public function createResource(User $user, Topic $topic, array $data): LearningResource
    {
        $resource = new LearningResource([
            ...$data,
            'position' => $this->nextPosition(LearningResource::where('topic_id', $topic->id)->where('user_id', $user->id)),
        ]);
        $resource->user_id = $user->id;
        $resource->topic_id = $topic->id;
        $resource->save();

        return $resource;
    }

    public function deletePath(LearningPath $path): void
    {
        DB::transaction(function () use ($path) {
            $moduleIds = Module::where('learning_path_id', $path->id)->pluck('id');
            $this->deleteTopicsWithResources(Topic::whereIn('module_id', $moduleIds));
            Module::whereIn('id', $moduleIds)->delete();
            $path->delete();
        });
    }

    public function deleteModule(Module $module): void
    {
        DB::transaction(function () use ($module) {
            $this->deleteTopicsWithResources(Topic::where('module_id', $module->id));
            $module->delete();
        });
    }

    public function deleteTopic(Topic $topic): void
    {
        DB::transaction(function () use ($topic) {
            $this->deleteTopicsWithResources(
                Topic::where('id', $topic->id)->orWhere('parent_id', $topic->id)
            );
        });
    }

    /**
     * Sets position = index of each id. The ids must be exactly the full set of siblings.
     *
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $siblings
     * @param  list<int>  $ids
     */
    public function reorder(Builder $siblings, array $ids): void
    {
        $matching = (clone $siblings)->whereIn('id', $ids)->count();
        $total = (clone $siblings)->count();

        if ($matching !== count($ids) || $total !== count($ids)) {
            throw ValidationException::withMessages([
                'ids' => 'Send the ids of all items in this list, and only those.',
            ]);
        }

        DB::transaction(function () use ($siblings, $ids) {
            foreach ($ids as $position => $id) {
                (clone $siblings)->whereKey($id)->update(['position' => $position]);
            }
        });
    }

    /** @param Builder<Topic> $topics */
    private function deleteTopicsWithResources(Builder $topics): void
    {
        $topicIds = $topics->pluck('id');
        LearningResource::whereIn('topic_id', $topicIds)->delete();
        Topic::whereIn('id', $topicIds)->delete();
    }

    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $siblings
     */
    private function nextPosition(Builder $siblings): int
    {
        $max = $siblings->max('position');

        return $max === null ? 0 : (int) $max + 1;
    }
}
