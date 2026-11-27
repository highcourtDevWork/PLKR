<?php

namespace Database\Factories;

use App\Enums\Level;
use App\Models\LearningPath;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LearningPath>
 */
class LearningPathFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->unique()->words(3, true),
            'description' => fake()->sentence(),
            'level' => Level::Beginner,
            'position' => 0,
        ];
    }

    /** Seeded content: visible to everyone, editable by no one. */
    public function system(): static
    {
        return $this->state(['user_id' => null]);
    }
}
