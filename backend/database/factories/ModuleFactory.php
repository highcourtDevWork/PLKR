<?php

namespace Database\Factories;

use App\Models\LearningPath;
use App\Models\Module;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Module>
 */
class ModuleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'learning_path_id' => LearningPath::factory(),
            'title' => fake()->words(2, true),
            'position' => 0,
        ];
    }
}
