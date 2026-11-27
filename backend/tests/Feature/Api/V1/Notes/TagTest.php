<?php

use App\Models\Note;
use App\Models\Tag;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

it('creates a tag with a slug', function () {
    $this->postJson('/api/v1/tags', ['name' => 'Query Builder'])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Query Builder')
        ->assertJsonPath('data.slug', 'query-builder');
});

it('rejects a name whose slug the user already has, but not another user\'s', function () {
    Tag::factory()->for($this->user)->create(['name' => 'Eloquent']);
    Tag::factory()->create(['name' => 'Testing']);

    $this->postJson('/api/v1/tags', ['name' => 'eloquent '])->assertUnprocessable()->assertJsonValidationErrors('name');
    $this->postJson('/api/v1/tags', ['name' => '!!!'])->assertUnprocessable()->assertJsonValidationErrors('name');
    $this->postJson('/api/v1/tags', ['name' => 'Testing'])->assertCreated();
});

it('lists own tags by name with note counts', function () {
    $b = Tag::factory()->for($this->user)->create(['name' => 'b']);
    Tag::factory()->for($this->user)->create(['name' => 'a']);
    Tag::factory()->create();
    Note::factory()->for($this->user)->create()->tags()->attach($b);

    $this->getJson('/api/v1/tags')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.name', 'a')
        ->assertJsonPath('data.1.notes_count', 1);
});

it('renames a tag, keeping its own name allowed', function () {
    $tag = Tag::factory()->for($this->user)->create(['name' => 'php']);

    $this->patchJson("/api/v1/tags/{$tag->id}", ['name' => 'PHP'])->assertOk()->assertJsonPath('data.slug', 'php');
});

it('deletes a tag and unlinks it from notes', function () {
    $tag = Tag::factory()->for($this->user)->create();
    $note = Note::factory()->for($this->user)->create();
    $note->tags()->attach($tag);

    $this->deleteJson("/api/v1/tags/{$tag->id}")->assertNoContent();

    expect($note->tags()->count())->toBe(0);
});

it('hides other users\' tags', function () {
    $foreign = Tag::factory()->create();

    $this->patchJson("/api/v1/tags/{$foreign->id}", ['name' => 'Mine'])->assertNotFound();
    $this->deleteJson("/api/v1/tags/{$foreign->id}")->assertNotFound();
});
