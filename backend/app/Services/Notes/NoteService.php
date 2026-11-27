<?php

namespace App\Services\Notes;

use App\Enums\ContentSource;
use App\Models\Note;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

/** Writes a note and its tag links together. */
class NoteService
{
    /**
     * @param  array<string, mixed>  $data  validated StoreNoteRequest data
     */
    public function create(User $user, array $data, ContentSource $source = ContentSource::Manual): Note
    {
        return DB::transaction(function () use ($user, $data, $source) {
            $note = $user->notes()->make(Arr::except($data, 'tag_ids'));
            $note->body = $data['body'] ?? '';
            $note->source = $source;
            $note->save();

            $note->tags()->sync($data['tag_ids'] ?? []);

            return $note->load(['topic', 'tags']);
        });
    }

    /**
     * @param  array<string, mixed>  $data  validated UpdateNoteRequest data
     */
    public function update(Note $note, array $data): Note
    {
        return DB::transaction(function () use ($note, $data) {
            $note->fill(Arr::except($data, 'tag_ids'));
            if (array_key_exists('body', $data)) {
                $note->body = $data['body'] ?? '';
            }
            $note->save();

            if (array_key_exists('tag_ids', $data)) {
                $note->tags()->sync($data['tag_ids'] ?? []);
                $note->touch(); // a tag change is an edit, even when no column changed
            }

            return $note->load(['topic', 'tags']);
        });
    }
}
