<?php

namespace App\Http\Requests\V1\Me;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Only ever acts on the authenticated user.
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'timezone' => ['sometimes', 'string', 'timezone:all'],
            'desired_retention' => ['sometimes', 'numeric', 'between:0.70,0.97'],
            'daily_new_limit' => ['sometimes', 'integer', 'between:0,500'],
            'daily_review_limit' => ['sometimes', 'integer', 'between:0,2000'],
            'ai_use_notes_context' => ['sometimes', 'boolean'],
            'settings' => ['sometimes', 'nullable', 'array'],
            'settings.theme' => ['sometimes', 'in:light,dark,system'],
        ];
    }
}
