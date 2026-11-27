<?php

/*
 * InnoDB FULLTEXT indexes only see committed rows, so these tests can't run inside the
 * RefreshDatabase transaction. tests/Pest.php gives this folder DatabaseTruncation instead.
 */

use App\Models\LearningPath;
use App\Models\Module;
use App\Models\Note;
use App\Models\Topic;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

it('finds notes by title and by body, best match first', function () {
    $inBody = Note::factory()->for($this->user)->create(['title' => 'Relationships', 'body' => 'Use eager loading to avoid N+1 queries.']);
    $inBoth = Note::factory()->for($this->user)->create(['title' => 'Eager loading', 'body' => 'Eager loading with with() and load().']);
    Note::factory()->for($this->user)->create(['title' => 'Migrations', 'body' => 'Schema builder basics.']);
    Note::factory()->create(['title' => 'Eager loading', 'body' => 'Another user\'s note.']);

    $ids = $this->getJson('/api/v1/search?q=eager')->assertOk()->json('data.notes.*.id');

    expect($ids)->toBe([$inBoth->id, $inBody->id]);
});

it('matches every word, the words as prefixes', function () {
    $both = Note::factory()->for($this->user)->create(['title' => 'Queue workers', 'body' => 'Supervisor keeps them running.']);
    Note::factory()->for($this->user)->create(['title' => 'Queue basics', 'body' => 'Dispatching jobs.']);

    $this->getJson('/api/v1/search?q=queue superv')
        ->assertOk()
        ->assertJsonCount(1, 'data.notes')
        ->assertJsonPath('data.notes.0.id', $both->id);
});

it('ignores boolean-mode operators and stopwords in the query', function () {
    $note = Note::factory()->for($this->user)->create(['title' => 'The service container', 'body' => 'Binding and resolving.']);

    $this->getJson('/api/v1/search?q='.urlencode('the -container" (*'))
        ->assertOk()
        ->assertJsonPath('data.notes.0.id', $note->id);
});

it('falls back to a title match for short queries', function () {
    $note = Note::factory()->for($this->user)->create(['title' => 'Go channels']);

    $this->getJson('/api/v1/search?q=go')->assertOk()->assertJsonPath('data.notes.0.id', $note->id);
    $this->getJson('/api/v1/search?q=%25')->assertOk()->assertJsonCount(0, 'data.notes'); // % is escaped
});

it('finds visible topics with their path, not other users\' topics', function () {
    $system = LearningPath::factory()->system()->create(['title' => 'Laravel']);
    $topic = Topic::factory()->for(Module::factory()->for($system))->create(['title' => 'Eloquent relationships']);
    Topic::factory()->create(['title' => 'Eloquent secrets']);

    $this->getJson('/api/v1/search?q=eloquent')
        ->assertOk()
        ->assertJsonCount(1, 'data.topics')
        ->assertJsonPath('data.topics.0', [
            'id' => $topic->id,
            'title' => 'Eloquent relationships',
            'learning_path' => ['id' => $system->id, 'title' => 'Laravel'],
        ]);
});

it('filters the notes list with q', function () {
    $hit = Note::factory()->for($this->user)->create(['title' => 'Policies', 'body' => 'Authorization with gates.']);
    Note::factory()->for($this->user)->create(['title' => 'Routing', 'body' => 'Route groups.']);

    $this->getJson('/api/v1/notes?filter[q]=authoriz')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $hit->id);
});

it('requires a query', function () {
    $this->getJson('/api/v1/search')->assertUnprocessable()->assertJsonValidationErrors('q');
});
