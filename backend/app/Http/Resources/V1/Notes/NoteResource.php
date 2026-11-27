<?php

namespace App\Http\Resources\V1\Notes;

use App\Models\Note;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Full note (with body) on show/store/update. Lists and search select an `excerpt` instead of the body.
 *
 * @mixin Note
 */
class NoteResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'kind' => $this->kind,
            'body' => $this->whenHas('body'),
            'excerpt' => $this->whenHas('excerpt'),
            'is_pinned' => $this->is_pinned,
            'source' => $this->source,
            'topic_id' => $this->topic_id,
            // null when unfiled or when the topic was deleted
            'topic' => $this->when($this->relationLoaded('topic'), fn () => $this->topic
                ? ['id' => $this->topic->id, 'title' => $this->topic->title]
                : null),
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'created_at' => $this->created_at?->toIso8601ZuluString(),
            'updated_at' => $this->updated_at?->toIso8601ZuluString(),
        ];
    }
}
