<?php

namespace Database\Factories;

use App\Enums\ResourceType;
use App\Models\LearningResource;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LearningResource>
 */
class LearningResourceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'topic_id' => Topic::factory(),
            'type' => ResourceType::Link,
            'title' => fake()->sentence(3),
            'url' => fake()->url(),
            'position' => 0,
        ];
    }
}
