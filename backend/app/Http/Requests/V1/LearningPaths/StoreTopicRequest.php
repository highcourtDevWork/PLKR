<?php

namespace App\Http\Requests\V1\LearningPaths;

use App\Enums\Level;
use App\Models\Module;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreTopicRequest extends FormRequest
{
    public function authorize(): bool
    {
        Gate::authorize('update', $this->route('module'));

        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Module $module */
        $module = $this->route('module');

        return [
            'title' => ['required', 'string', 'max:150'],
            'summary' => ['nullable', 'string', 'max:5000'],
            'level' => ['required', Rule::enum(Level::class)],
            'estimated_minutes' => ['nullable', 'integer', 'between:1,10000'],
            // The parent of a subtopic must be a top-level topic in the same module (max depth 2).
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('topics', 'id')
                    ->where('module_id', $module->id)
                    ->whereNull('parent_id')
                    ->whereNull('deleted_at'),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['parent_id.exists' => 'Subtopics can only be added to a top-level topic of this module.'];
    }
}
