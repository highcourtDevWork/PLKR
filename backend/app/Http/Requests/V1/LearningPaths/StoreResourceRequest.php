<?php

namespace App\Http\Requests\V1\LearningPaths;

use App\Enums\ResourceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreResourceRequest extends FormRequest
{
    /** Anyone who can see the topic may attach their own resources, also to system topics. */
    public function authorize(): bool
    {
        Gate::authorize('view', $this->route('topic'));

        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(ResourceType::class)],
            'title' => ['required', 'string', 'max:200'],
            // http(s) only: the URL is rendered as a link, so javascript: and data: URLs must be rejected.
            'url' => ['required', 'string', 'max:2048', 'url:http,https'],
            'description' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
