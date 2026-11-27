<?php

namespace App\Http\Requests\V1\LearningPaths;

use App\Enums\Level;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLearningPathRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Any user may create their own paths.
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:5000'],
            'level' => ['required', Rule::enum(Level::class)],
            'color' => ['nullable', 'string', 'max:32'],
            'icon' => ['nullable', 'string', 'max:32'],
        ];
    }
}
