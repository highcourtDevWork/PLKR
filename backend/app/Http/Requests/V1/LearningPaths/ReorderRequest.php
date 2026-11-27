<?php

namespace App\Http\Requests\V1\LearningPaths;

use Illuminate\Foundation\Http\FormRequest;

/** Authorization depends on the parent, so the controller authorizes it. */
class ReorderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['integer', 'distinct'],
        ];
    }

    /** @return list<int> */
    public function ids(): array
    {
        return array_map(intval(...), array_values($this->validated('ids')));
    }
}
