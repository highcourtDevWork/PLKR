<?php

namespace App\Http\Resources\V1\LearningPaths;

use App\Models\LearningResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin LearningResource
 */
class ResourceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'topic_id' => $this->topic_id,
            'type' => $this->type,
            'title' => $this->title,
            'url' => $this->url,
            'description' => $this->description,
            'position' => $this->position,
            'created_at' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
