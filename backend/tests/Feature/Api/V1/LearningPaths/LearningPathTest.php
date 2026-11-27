<?php

use App\Enums\TopicStatus;
use App\Models\LearningPath;
use App\Models\LearningResource;
use App\Models\Module;
use App\Models\Topic;
use App\Models\User;
use App\Models\UserTopicProgress;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

it('requires authentication', function () {
    auth()->logout();
    $this->app['auth']->forgetGuards();

    $this->getJson('/api/v1/learning-paths')->assertUnauthorized();
});

it('lists own and system paths but not other users paths', function () {
    $own = LearningPath::factory()->for($this->user)->create();
    $system = LearningPath::factory()->system()->create();
    LearningPath::factory()->create(); // someone else's

    $this->getJson('/api/v1/learning-paths')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.id', $own->id)
        ->assertJsonPath('data.0.can_edit', true)
        ->assertJsonPath('data.1.id', $system->id)
        ->assertJsonPath('data.1.is_system', true)
        ->assertJsonPath('data.1.can_edit', false)
        ->assertJsonStructure(['data', 'links', 'meta' => ['current_page', 'total']]);
});

it('filters system paths and counts topics and completed topics', function () {
    $system = LearningPath::factory()->system()->create();
    $module = Module::factory()->for($system)->create();
    [$done] = Topic::factory()->count(3)->for($module)->create();
    UserTopicProgress::create(['user_id' => $this->user->id, 'topic_id' => $done->id, 'status' => TopicStatus::Completed]);
    LearningPath::factory()->for($this->user)->create();

    $this->getJson('/api/v1/learning-paths?filter[is_system]=1')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.modules_count', 1)
        ->assertJsonPath('data.0.topics_count', 3)
        ->assertJsonPath('data.0.completed_topics_count', 1);
});

it('rejects unknown filters and sorts', function () {
    $this->getJson('/api/v1/learning-paths?filter[user_id]=1')->assertStatus(400);
    $this->getJson('/api/v1/learning-paths?sort=user_id')->assertStatus(400);
});

it('creates a path at the end of the list', function () {
    LearningPath::factory()->for($this->user)->create(['position' => 4]);

    $this->postJson('/api/v1/learning-paths', ['title' => 'Laravel', 'level' => 'intermediate'])
        ->assertCreated()
        ->assertJsonPath('data.title', 'Laravel')
        ->assertJsonPath('data.position', 5)
        ->assertJsonPath('data.can_edit', true);
});

it('validates new paths', function () {
    $this->postJson('/api/v1/learning-paths', ['level' => 'expert'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['title', 'level']);
});

it('never takes the owner from the request', function () {
    $other = User::factory()->create();

    $this->postJson('/api/v1/learning-paths', ['title' => 'Mine', 'level' => 'beginner', 'user_id' => $other->id])
        ->assertCreated();

    expect(LearningPath::where('title', 'Mine')->value('user_id'))->toBe($this->user->id);
});

it('shows the full tree with nested subtopics and progress in a few queries', function () {
    $path = LearningPath::factory()->for($this->user)->create();
    $modules = Module::factory()->count(3)->for($path)->sequence(fn ($s) => ['position' => $s->index])->create();
    foreach ($modules as $module) {
        $parents = Topic::factory()->count(3)->for($module)->sequence(fn ($s) => ['position' => $s->index])->create();
        Topic::factory()->count(2)->childOf($parents[0])->create();
    }
    $first = $modules[0]->topics()->whereNull('parent_id')->orderBy('position')->first();
    UserTopicProgress::create(['user_id' => $this->user->id, 'topic_id' => $first->id, 'status' => TopicStatus::InProgress]);

    $queries = 0;
    DB::listen(function () use (&$queries) {
        $queries++;
    });

    $this->getJson("/api/v1/learning-paths/{$path->id}")
        ->assertOk()
        ->assertJsonCount(3, 'data.modules')
        ->assertJsonCount(3, 'data.modules.0.topics')
        ->assertJsonCount(2, 'data.modules.0.topics.0.subtopics')
        ->assertJsonPath('data.modules.0.topics.0.progress.status', 'in_progress')
        ->assertJsonPath('data.modules.0.topics.1.progress.status', 'not_started')
        ->assertJsonMissingPath('data.modules.0.topics.0.subtopics.0.subtopics');

    // Route binding + modules + topics + progress, independent of tree size.
    expect($queries)->toBeLessThanOrEqual(4);
});

it('shows system paths read-only and hides other users paths', function () {
    $system = LearningPath::factory()->system()->create();
    $foreign = LearningPath::factory()->create();

    $this->getJson("/api/v1/learning-paths/{$system->id}")->assertOk()->assertJsonPath('data.can_edit', false);
    $this->getJson("/api/v1/learning-paths/{$foreign->id}")->assertNotFound();
});

it('updates own paths only', function () {
    $own = LearningPath::factory()->for($this->user)->create();
    $system = LearningPath::factory()->system()->create();
    $foreign = LearningPath::factory()->create();

    $this->patchJson("/api/v1/learning-paths/{$own->id}", ['title' => 'Renamed'])
        ->assertOk()->assertJsonPath('data.title', 'Renamed');
    $this->patchJson("/api/v1/learning-paths/{$system->id}", ['title' => 'Hacked'])->assertForbidden();
    $this->patchJson("/api/v1/learning-paths/{$foreign->id}", ['title' => 'Hacked'])->assertNotFound();
});

it('soft-deletes a path with its modules, topics and resources', function () {
    $path = LearningPath::factory()->for($this->user)->create();
    $module = Module::factory()->for($path)->create();
    $topic = Topic::factory()->for($module)->create();
    $subtopic = Topic::factory()->childOf($topic)->create();
    $resource = LearningResource::factory()->for($this->user)->for($subtopic)->create();

    $this->deleteJson("/api/v1/learning-paths/{$path->id}")->assertNoContent();

    expect($path->fresh()->trashed())->toBeTrue()
        ->and($module->fresh()->trashed())->toBeTrue()
        ->and($topic->fresh()->trashed())->toBeTrue()
        ->and($subtopic->fresh()->trashed())->toBeTrue()
        ->and($resource->fresh()->trashed())->toBeTrue();
    $this->getJson("/api/v1/learning-paths/{$path->id}")->assertNotFound();
});

it('cannot delete system paths', function () {
    $system = LearningPath::factory()->system()->create();

    $this->deleteJson("/api/v1/learning-paths/{$system->id}")->assertForbidden();
    expect($system->fresh()->trashed())->toBeFalse();
});

it('reorders own paths', function () {
    [$a, $b, $c] = LearningPath::factory()->count(3)->for($this->user)
        ->sequence(fn ($s) => ['position' => $s->index])->create();

    $this->postJson('/api/v1/learning-paths/reorder', ['ids' => [$c->id, $a->id, $b->id]])->assertNoContent();

    expect([$c->fresh()->position, $a->fresh()->position, $b->fresh()->position])->toBe([0, 1, 2]);
});

it('rejects reorder lists that are incomplete or contain foreign ids', function () {
    [$a, $b] = LearningPath::factory()->count(2)->for($this->user)->create();
    $foreign = LearningPath::factory()->create();

    $this->postJson('/api/v1/learning-paths/reorder', ['ids' => [$a->id]])
        ->assertUnprocessable()->assertJsonValidationErrors('ids');
    $this->postJson('/api/v1/learning-paths/reorder', ['ids' => [$a->id, $b->id, $foreign->id]])
        ->assertUnprocessable()->assertJsonValidationErrors('ids');
});
