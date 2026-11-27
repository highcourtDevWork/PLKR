<?php

use App\Models\LearningPath;
use App\Models\Module;
use App\Models\Topic;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
    $this->path = LearningPath::factory()->for($this->user)->create();
});

it('adds modules to own paths at the end', function () {
    Module::factory()->for($this->path)->create(['position' => 2]);

    $this->postJson("/api/v1/learning-paths/{$this->path->id}/modules", ['title' => 'Eloquent'])
        ->assertCreated()
        ->assertJsonPath('data.title', 'Eloquent')
        ->assertJsonPath('data.position', 3)
        ->assertJsonPath('data.learning_path_id', $this->path->id);
});

it('cannot add modules to system or foreign paths', function () {
    $system = LearningPath::factory()->system()->create();
    $foreign = LearningPath::factory()->create();

    $this->postJson("/api/v1/learning-paths/{$system->id}/modules", ['title' => 'X'])->assertForbidden();
    $this->postJson("/api/v1/learning-paths/{$foreign->id}/modules", ['title' => 'X'])->assertNotFound();
});

it('validates modules', function () {
    $this->postJson("/api/v1/learning-paths/{$this->path->id}/modules", ['title' => '', 'level' => 'expert'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['title', 'level']);
});

it('updates and deletes own modules with their topics', function () {
    $module = Module::factory()->for($this->path)->create();
    $topic = Topic::factory()->for($module)->create();

    $this->patchJson("/api/v1/modules/{$module->id}", ['title' => 'Renamed'])
        ->assertOk()->assertJsonPath('data.title', 'Renamed');
    $this->deleteJson("/api/v1/modules/{$module->id}")->assertNoContent();

    expect($module->fresh()->trashed())->toBeTrue()
        ->and($topic->fresh()->trashed())->toBeTrue();
});

it('cannot change modules of system or foreign paths', function () {
    $systemModule = Module::factory()->for(LearningPath::factory()->system())->create();
    $foreignModule = Module::factory()->create();

    $this->patchJson("/api/v1/modules/{$systemModule->id}", ['title' => 'X'])->assertForbidden();
    $this->deleteJson("/api/v1/modules/{$systemModule->id}")->assertForbidden();
    $this->patchJson("/api/v1/modules/{$foreignModule->id}", ['title' => 'X'])->assertNotFound();
    $this->deleteJson("/api/v1/modules/{$foreignModule->id}")->assertNotFound();
});

it('reorders modules within a path', function () {
    [$a, $b] = Module::factory()->count(2)->for($this->path)
        ->sequence(fn ($s) => ['position' => $s->index])->create();

    $this->postJson("/api/v1/learning-paths/{$this->path->id}/modules/reorder", ['ids' => [$b->id, $a->id]])
        ->assertNoContent();

    expect($b->fresh()->position)->toBe(0)->and($a->fresh()->position)->toBe(1);
});

it('rejects module ids from another path when reordering', function () {
    $a = Module::factory()->for($this->path)->create();
    $other = Module::factory()->for(LearningPath::factory()->for($this->user))->create();

    $this->postJson("/api/v1/learning-paths/{$this->path->id}/modules/reorder", ['ids' => [$a->id, $other->id]])
        ->assertUnprocessable();
});
