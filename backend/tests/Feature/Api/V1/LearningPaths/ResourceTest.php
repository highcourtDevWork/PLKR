<?php

use App\Models\LearningPath;
use App\Models\LearningResource;
use App\Models\Module;
use App\Models\Topic;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
    $this->topic = Topic::factory()->for(Module::factory()->for(LearningPath::factory()->for($this->user)))->create();
});

it('attaches resources to a topic', function () {
    $this->postJson("/api/v1/topics/{$this->topic->id}/resources", [
        'type' => 'video', 'title' => 'Laracasts: Eloquent', 'url' => 'https://laracasts.com/series/eloquent',
    ])->assertCreated()
        ->assertJsonPath('data.type', 'video')
        ->assertJsonPath('data.position', 0);
});

it('only accepts http and https links', function (string $url) {
    $this->postJson("/api/v1/topics/{$this->topic->id}/resources", ['type' => 'link', 'title' => 'Bad', 'url' => $url])
        ->assertUnprocessable()->assertJsonValidationErrors('url');
})->with(['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'ftp://example.com/file', 'not a url']);

it('lets users attach private resources to system topics', function () {
    $system = Topic::factory()->for(Module::factory()->for(LearningPath::factory()->system()))->create();
    $othersResource = LearningResource::factory()->for($system)->create();

    $this->postJson("/api/v1/topics/{$system->id}/resources", ['type' => 'doc', 'title' => 'Docs', 'url' => 'https://laravel.com/docs'])
        ->assertCreated();

    $this->getJson("/api/v1/topics/{$system->id}/resources")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonMissing(['id' => $othersResource->id]);
});

it('updates and deletes own resources only', function () {
    $own = LearningResource::factory()->for($this->user)->for($this->topic)->create();
    $foreign = LearningResource::factory()->create();

    $this->patchJson("/api/v1/resources/{$own->id}", ['title' => 'Renamed'])->assertOk()->assertJsonPath('data.title', 'Renamed');
    $this->patchJson("/api/v1/resources/{$foreign->id}", ['title' => 'X'])->assertNotFound();
    $this->deleteJson("/api/v1/resources/{$foreign->id}")->assertNotFound();
    $this->deleteJson("/api/v1/resources/{$own->id}")->assertNoContent();

    expect($own->fresh()->trashed())->toBeTrue();
});

it('hides resources of foreign topics', function () {
    $foreign = Topic::factory()->create();

    $this->getJson("/api/v1/topics/{$foreign->id}/resources")->assertNotFound();
    $this->postJson("/api/v1/topics/{$foreign->id}/resources", ['type' => 'link', 'title' => 'X', 'url' => 'https://x.test'])
        ->assertNotFound();
});
