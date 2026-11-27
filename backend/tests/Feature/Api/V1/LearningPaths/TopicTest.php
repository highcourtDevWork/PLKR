<?php

use App\Models\LearningPath;
use App\Models\LearningResource;
use App\Models\Module;
use App\Models\Topic;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
    $this->module = Module::factory()->for(LearningPath::factory()->for($this->user))->create();
});

it('adds top-level topics and subtopics', function () {
    $this->postJson("/api/v1/modules/{$this->module->id}/topics", ['title' => 'Relationships', 'level' => 'beginner'])
        ->assertCreated()
        ->assertJsonPath('data.parent_id', null)
        ->assertJsonPath('data.position', 0);

    $parentId = Topic::where('title', 'Relationships')->value('id');

    $this->postJson("/api/v1/modules/{$this->module->id}/topics", [
        'title' => 'Eager loading', 'level' => 'intermediate', 'parent_id' => $parentId, 'estimated_minutes' => 30,
    ])->assertCreated()
        ->assertJsonPath('data.parent_id', $parentId)
        ->assertJsonPath('data.estimated_minutes', 30);
});

it('limits nesting to two levels and to the same module', function () {
    $parent = Topic::factory()->for($this->module)->create();
    $subtopic = Topic::factory()->childOf($parent)->create();
    $elsewhere = Topic::factory()->for(Module::factory()->for($this->module->learningPath))->create();

    $this->postJson("/api/v1/modules/{$this->module->id}/topics", ['title' => 'Too deep', 'level' => 'beginner', 'parent_id' => $subtopic->id])
        ->assertUnprocessable()->assertJsonValidationErrors('parent_id');
    $this->postJson("/api/v1/modules/{$this->module->id}/topics", ['title' => 'Wrong module', 'level' => 'beginner', 'parent_id' => $elsewhere->id])
        ->assertUnprocessable()->assertJsonValidationErrors('parent_id');
});

it('shows a topic with breadcrumb, progress, subtopics and own resource count', function () {
    $topic = Topic::factory()->for($this->module)->create();
    Topic::factory()->count(2)->childOf($topic)->create();
    LearningResource::factory()->count(2)->for($this->user)->for($topic)->create();
    LearningResource::factory()->for($topic)->create(); // another user's

    $this->getJson("/api/v1/topics/{$topic->id}")
        ->assertOk()
        ->assertJsonPath('data.breadcrumb.module.id', $this->module->id)
        ->assertJsonPath('data.breadcrumb.learning_path.id', $this->module->learning_path_id)
        ->assertJsonPath('data.progress.status', 'not_started')
        ->assertJsonCount(2, 'data.subtopics')
        ->assertJsonPath('data.resources_count', 2)
        ->assertJsonPath('data.can_edit', true);
});

it('shows system topics read-only and hides foreign topics', function () {
    $system = Topic::factory()->for(Module::factory()->for(LearningPath::factory()->system()))->create();
    $foreign = Topic::factory()->create();

    $this->getJson("/api/v1/topics/{$system->id}")->assertOk()
        ->assertJsonPath('data.can_edit', false)->assertJsonPath('data.is_system', true);
    $this->patchJson("/api/v1/topics/{$system->id}", ['title' => 'X'])->assertForbidden();
    $this->getJson("/api/v1/topics/{$foreign->id}")->assertNotFound();
    $this->deleteJson("/api/v1/topics/{$foreign->id}")->assertNotFound();
});

it('updates topics', function () {
    $topic = Topic::factory()->for($this->module)->create();

    $this->patchJson("/api/v1/topics/{$topic->id}", ['title' => 'Renamed', 'level' => 'advanced'])
        ->assertOk()
        ->assertJsonPath('data.title', 'Renamed')
        ->assertJsonPath('data.level', 'advanced');
});

it('deletes a topic with its subtopics and resources', function () {
    $topic = Topic::factory()->for($this->module)->create();
    $sub = Topic::factory()->childOf($topic)->create();
    $resource = LearningResource::factory()->for($this->user)->for($sub)->create();
    $sibling = Topic::factory()->for($this->module)->create();

    $this->deleteJson("/api/v1/topics/{$topic->id}")->assertNoContent();

    expect($topic->fresh()->trashed())->toBeTrue()
        ->and($sub->fresh()->trashed())->toBeTrue()
        ->and($resource->fresh()->trashed())->toBeTrue()
        ->and($sibling->fresh()->trashed())->toBeFalse();
});

it('reorders sibling topics', function () {
    $parent = Topic::factory()->for($this->module)->create();
    [$a, $b] = Topic::factory()->count(2)->childOf($parent)->sequence(fn ($s) => ['position' => $s->index])->create();

    $this->postJson("/api/v1/modules/{$this->module->id}/topics/reorder", ['ids' => [$b->id, $a->id]])->assertNoContent();

    expect($b->fresh()->position)->toBe(0)->and($a->fresh()->position)->toBe(1);
});

it('rejects reordering topics with different parents', function () {
    $parent = Topic::factory()->for($this->module)->create();
    $child = Topic::factory()->childOf($parent)->create();

    $this->postJson("/api/v1/modules/{$this->module->id}/topics/reorder", ['ids' => [$parent->id, $child->id]])
        ->assertUnprocessable()->assertJsonValidationErrors('ids');
});
