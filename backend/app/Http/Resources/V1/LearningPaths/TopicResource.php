<?php

namespace App\Http\Resources\V1\LearningPaths;

use App\Enums\TopicStatus;
use App\Models\Topic;
use App\Models\UserTopicProgress;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Used in the path tree (with progress and subtopics) and on the topic page
 * (additionally with breadcrumb, can_edit and resources_count).
 *
 * @mixin Topic
 */
class TopicResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $pathLoaded = $this->relationLoaded('module') && $this->module->relationLoaded('learningPath');

        return [
            'id' => $this->id,
            'module_id' => $this->module_id,
            'parent_id' => $this->parent_id,
            'title' => $this->title,
            'summary' => $this->summary,
            'level' => $this->level,
            'estimated_minutes' => $this->estimated_minutes,
            'position' => $this->position,
            // when(), not whenLoaded(): a loaded-but-null relation must still render as "not_started".
            'progress' => $this->when($this->relationLoaded('progress'), fn () => self::progress($this->progress)),
            'subtopics' => self::collection($this->whenLoaded('children')),
            'resources_count' => $this->whenCounted('resources'),
            'notes_count' => $this->whenCounted('notes'),
            'breadcrumb' => $this->when($pathLoaded, fn () => [
                'learning_path' => ['id' => $this->module->learningPath->id, 'title' => $this->module->learningPath->title],
                'module' => ['id' => $this->module->id, 'title' => $this->module->title],
                'parent' => $this->parent_id && $this->relationLoaded('parent')
                    ? ['id' => $this->parent->id, 'title' => $this->parent->title]
                    : null,
            ]),
            'is_system' => $this->when($pathLoaded, fn () => $this->module->learningPath->isSystem()),
            'can_edit' => $this->when($pathLoaded, fn () => $this->module->learningPath->isOwnedBy($request->user())),
        ];
    }

    /**
     * @return array{status: TopicStatus, mastery: float, last_studied_at: ?string, completed_at: ?string}
     */
    public static function progress(?UserTopicProgress $progress): array
    {
        return [
            'status' => $progress->status ?? TopicStatus::NotStarted,
            'mastery' => (float) ($progress->mastery ?? 0),
            'last_studied_at' => $progress?->last_studied_at?->toIso8601ZuluString(),
            'completed_at' => $progress?->completed_at?->toIso8601ZuluString(),
        ];
    }
}
