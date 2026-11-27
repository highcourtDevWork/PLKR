<?php

namespace App\Http\Requests\V1\LearningPaths;

use App\Enums\TopicStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateTopicProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        Gate::authorize('view', $this->route('topic'));

        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(TopicStatus::class)],
        ];
    }
}
