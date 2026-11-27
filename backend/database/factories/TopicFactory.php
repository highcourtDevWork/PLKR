<?php

namespace Database\Factories;

use App\Enums\Level;
use App\Models\Module;
use App\Models\Topic;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Topic>
 */
class TopicFactory extends Factory
{
    public function definition(): array
    {
        return [
            'module_id' => Module::factory(),
            'parent_id' => null,
            'title' => fake()->words(3, true),
            'level' => Level::Beginner,
            'position' => 0,
        ];
    }

    public function childOf(Topic $parent): static
    {
        return $this->state(['module_id' => $parent->module_id, 'parent_id' => $parent->id]);
    }
}
