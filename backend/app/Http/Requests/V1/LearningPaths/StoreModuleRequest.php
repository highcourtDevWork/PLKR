<?php

namespace App\Http\Requests\V1\LearningPaths;

use App\Enums\Level;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreModuleRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:5000'],
            'level' => ['nullable', Rule::enum(Level::class)],
        ];
    }
}
