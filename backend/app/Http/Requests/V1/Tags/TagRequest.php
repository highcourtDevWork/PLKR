<?php

namespace App\Http\Requests\V1\Tags;

use App\Models\Tag;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

/** Create and rename. The name must produce a slug that is unique among the user's tags. */
class TagRequest extends FormRequest
{
    public function authorize(): bool
    {
        if ($tag = $this->route('tag')) {
            Gate::authorize('update', $tag);
        }

        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:50', function (string $attribute, mixed $value, Closure $fail) {
                $slug = Tag::slugFor((string) $value);
                if ($slug === '') {
                    $fail('The name must contain letters or numbers.');

                    return;
                }

                $taken = Tag::where('user_id', $this->user()->id)
                    ->where('slug', $slug)
                    ->when($this->route('tag'), fn ($q, Tag $tag) => $q->whereKeyNot($tag->id))
                    ->exists();
                if ($taken) {
                    $fail('You already have this tag.');
                }
            }],
        ];
    }
}
