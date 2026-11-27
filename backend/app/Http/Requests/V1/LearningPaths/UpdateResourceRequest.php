<?php

namespace App\Http\Requests\V1\LearningPaths;

use App\Enums\ResourceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateResourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        Gate::authorize('update', $this->route('resource'));

        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['sometimes', 'required', Rule::enum(ResourceType::class)],
            'title' => ['sometimes', 'required', 'string', 'max:200'],
            'url' => ['sometimes', 'required', 'string', 'max:2048', 'url:http,https'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }
}
