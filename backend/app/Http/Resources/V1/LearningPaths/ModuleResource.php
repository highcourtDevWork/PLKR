<?php

namespace App\Http\Resources\V1\LearningPaths;

use App\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Module
 */
class ModuleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'learning_path_id' => $this->learning_path_id,
            'title' => $this->title,
            'description' => $this->description,
            'level' => $this->level,
            'position' => $this->position,
            'topics' => TopicResource::collection($this->whenLoaded('topics')),
        ];
    }
}
