<?php

namespace App\Http\Requests\V1\Notes;

use App\Enums\NoteKind;
use App\Models\Topic;
use App\Models\User;
use Closure;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/** Field rules shared by StoreNoteRequest and UpdateNoteRequest. */
final class NoteRules
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public static function for(User $user): array
    {
        return [
            'title' => ['required', 'string', 'max:200'],
            'body' => ['nullable', 'string', 'max:200000'],
            'kind' => [Rule::enum(NoteKind::class)],
            'is_pinned' => ['boolean'],
            // Own topics and system topics; anything else is reported as invalid, not as 404.
            'topic_id' => ['nullable', 'integer', function (string $attribute, mixed $value, Closure $fail) use ($user) {
                $topic = Topic::find($value);
                if (! $topic || Gate::forUser($user)->denies('view', $topic)) {
                    $fail('The selected topic is invalid.');
                }
            }],
            'tag_ids' => ['array', 'max:20'],
            'tag_ids.*' => ['integer', 'distinct', Rule::exists('tags', 'id')->where('user_id', $user->id)],
        ];
    }
}
