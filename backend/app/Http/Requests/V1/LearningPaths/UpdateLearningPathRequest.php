<?php

namespace App\Http\Requests\V1\LearningPaths;

use App\Enums\Level;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateLearningPathRequest extends FormRequest
{
    public function authorize(): bool
    {
        Gate::authorize('update', $this->route('learningPath'));

        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:150'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'level' => ['sometimes', 'required', Rule::enum(Level::class)],
            'color' => ['sometimes', 'nullable', 'string', 'max:32'],
            'icon' => ['sometimes', 'nullable', 'string', 'max:32'],
        ];
    }
}
