<?php

namespace App\Http\Requests\V1\LearningPaths;

use App\Enums\Level;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateModuleRequest extends FormRequest
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
        return [
            'title' => ['sometimes', 'required', 'string', 'max:150'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'level' => ['sometimes', 'nullable', Rule::enum(Level::class)],
        ];
    }
}
