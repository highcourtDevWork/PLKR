<?php

namespace App\Http\Requests\V1\Notes;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        Gate::authorize('update', $this->route('note'));

        return true;
    }

    /**
     * Partial update: every field is optional.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return array_map(fn (array $rules) => ['sometimes', ...$rules], NoteRules::for($this->user()));
    }
}
