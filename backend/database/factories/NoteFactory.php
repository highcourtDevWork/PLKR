<?php

namespace Database\Factories;

use App\Enums\NoteKind;
use App\Models\Note;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Note>
 */
class NoteFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'topic_id' => null,
            'title' => fake()->sentence(4),
            'kind' => NoteKind::General,
            'body' => fake()->paragraphs(2, true),
            'is_pinned' => false,
        ];
    }
}
