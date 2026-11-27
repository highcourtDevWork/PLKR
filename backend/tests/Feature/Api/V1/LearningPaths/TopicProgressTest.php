<?php

use App\Models\LearningPath;
use App\Models\Module;
use App\Models\Topic;
use App\Models\User;
use App\Models\UserTopicProgress;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
    $this->topic = Topic::factory()->for(Module::factory()->for(LearningPath::factory()->for($this->user)))->create();
});

it('marks a topic as completed and back', function () {
    $this->putJson("/api/v1/topics/{$this->topic->id}/progress", ['status' => 'completed'])
        ->assertOk()
        ->assertJsonPath('data.status', 'completed')
        ->assertJsonPath('data.mastery', 0);

    expect(UserTopicProgress::first()->completed_at)->not->toBeNull();

    $this->putJson("/api/v1/topics/{$this->topic->id}/progress", ['status' => 'in_progress'])
        ->assertOk()
        ->assertJsonPath('data.completed_at', null);

    expect(UserTopicProgress::count())->toBe(1);
});

it('tracks progress on system topics separately per user', function () {
    $system = Topic::factory()->for(Module::factory()->for(LearningPath::factory()->system()))->create();
    $other = User::factory()->create();

    $this->putJson("/api/v1/topics/{$system->id}/progress", ['status' => 'in_progress'])->assertOk();
    $this->actingAs($other)->putJson("/api/v1/topics/{$system->id}/progress", ['status' => 'completed'])->assertOk();

    expect(UserTopicProgress::where('user_id', $this->user->id)->value('status')->value)->toBe('in_progress');
});

it('rejects invalid status and foreign topics', function () {
    $this->putJson("/api/v1/topics/{$this->topic->id}/progress", ['status' => 'mastered'])
        ->assertUnprocessable()->assertJsonValidationErrors('status');

    $foreign = Topic::factory()->create();
    $this->putJson("/api/v1/topics/{$foreign->id}/progress", ['status' => 'completed'])->assertNotFound();
});
