<?php

namespace App\Http\Resources\V1\LearningPaths;

use App\Models\LearningPath;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin LearningPath
 */
class LearningPathResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'level' => $this->level,
            'color' => $this->color,
            'icon' => $this->icon,
            'position' => $this->position,
            'is_system' => $this->isSystem(),
            'can_edit' => $this->isOwnedBy($request->user()),
            'modules_count' => $this->whenCounted('modules'),
            'topics_count' => $this->whenCounted('topics'),
            'completed_topics_count' => $this->whenCounted('completed_topics'),
            'modules' => ModuleResource::collection($this->whenLoaded('modules')),
            'created_at' => $this->created_at?->toIso8601ZuluString(),
            'updated_at' => $this->updated_at?->toIso8601ZuluString(),
        ];
    }
}
