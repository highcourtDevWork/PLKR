<?php

namespace App\Http\Requests\V1\LearningPaths;

use App\Enums\Level;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateTopicRequest extends FormRequest
{
    public function authorize(): bool
    {
        Gate::authorize('update', $this->route('topic'));

        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:150'],
            'summary' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'level' => ['sometimes', 'required', Rule::enum(Level::class)],
            'estimated_minutes' => ['sometimes', 'nullable', 'integer', 'between:1,10000'],
        ];
    }
}
