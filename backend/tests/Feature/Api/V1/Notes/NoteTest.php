<?php

use App\Models\LearningPath;
use App\Models\Module;
use App\Models\Note;
use App\Models\Tag;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

it('creates a note with a topic and tags', function () {
    $topic = Topic::factory()->for(Module::factory()->for(LearningPath::factory()->for($this->user)))->create();
    $tags = Tag::factory()->for($this->user)->count(2)->create();

    $this->postJson('/api/v1/notes', [
        'title' => 'Eager loading',
        'body' => "Use `with()`.\n\n```php\nUser::with('posts')->get();\n```",
        'kind' => 'snippet',
        'topic_id' => $topic->id,
        'tag_ids' => $tags->pluck('id')->all(),
    ])->assertCreated()
        ->assertJsonPath('data.kind', 'snippet')
        ->assertJsonPath('data.source', 'manual')
        ->assertJsonPath('data.is_pinned', false)
        ->assertJsonPath('data.topic', ['id' => $topic->id, 'title' => $topic->title])
        ->assertJsonCount(2, 'data.tags');
});

it('defaults kind and body and allows unfiled notes', function () {
    $this->postJson('/api/v1/notes', ['title' => 'Quick thought'])
        ->assertCreated()
        ->assertJsonPath('data.kind', 'general')
        ->assertJsonPath('data.body', '')
        ->assertJsonPath('data.topic', null);
});

it('validates notes', function () {
    $this->postJson('/api/v1/notes', ['kind' => 'poem', 'tag_ids' => ['x']])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['title', 'kind', 'tag_ids.0']);
});

it('accepts system topics but not another user\'s topic or tag', function () {
    $system = Topic::factory()->for(Module::factory()->for(LearningPath::factory()->system()))->create();
    $foreignTopic = Topic::factory()->create();
    $foreignTag = Tag::factory()->create();

    $this->postJson('/api/v1/notes', ['title' => 'On a system topic', 'topic_id' => $system->id])->assertCreated();
    $this->postJson('/api/v1/notes', ['title' => 'X', 'topic_id' => $foreignTopic->id, 'tag_ids' => [$foreignTag->id]])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['topic_id', 'tag_ids.0']);
});

it('lists own notes pinned first with an excerpt instead of the body', function () {
    Note::factory()->for($this->user)->create(['title' => 'Old pinned', 'is_pinned' => true, 'updated_at' => now()->subDay()]);
    Note::factory()->for($this->user)->create(['title' => 'Newest', 'body' => str_repeat('a', 500)]);
    Note::factory()->create(['title' => 'Someone else\'s']);

    $response = $this->getJson('/api/v1/notes')->assertOk()->assertJsonCount(2, 'data');

    expect($response->json('data.*.title'))->toBe(['Old pinned', 'Newest'])
        ->and($response->json('data.1.excerpt'))->toHaveLength(300)
        ->and($response->json('data.1'))->not->toHaveKey('body');
});

it('filters notes by topic, kind, tag and pinned', function () {
    $topic = Topic::factory()->for(Module::factory()->for(LearningPath::factory()->for($this->user)))->create();
    $tag = Tag::factory()->for($this->user)->create();

    $match = Note::factory()->for($this->user)->create(['topic_id' => $topic->id, 'kind' => 'mistake', 'is_pinned' => true]);
    $match->tags()->attach($tag);
    Note::factory()->for($this->user)->create(['topic_id' => $topic->id, 'kind' => 'mistake']);
    Note::factory()->for($this->user)->create(['kind' => 'mistake', 'is_pinned' => true]);

    $this->getJson("/api/v1/notes?filter[topic_id]={$topic->id}&filter[kind]=mistake&filter[tag_id]={$tag->id}&filter[pinned]=1")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $match->id);

    $this->getJson('/api/v1/notes?filter[owner]=1')->assertStatus(400);
});

it('updates a note, its tags and its pin', function () {
    $note = Note::factory()->for($this->user)->create();
    $old = Tag::factory()->for($this->user)->create();
    $new = Tag::factory()->for($this->user)->create();
    $note->tags()->attach($old);

    $this->patchJson("/api/v1/notes/{$note->id}", ['is_pinned' => true, 'tag_ids' => [$new->id]])
        ->assertOk()
        ->assertJsonPath('data.is_pinned', true)
        ->assertJsonPath('data.tags.0.id', $new->id)
        ->assertJsonCount(1, 'data.tags');

    $this->patchJson("/api/v1/notes/{$note->id}", ['title' => 'Renamed'])
        ->assertOk()
        ->assertJsonCount(1, 'data.tags'); // tags untouched when tag_ids is absent
});

it('hides other users\' notes', function () {
    $foreign = Note::factory()->create();

    $this->getJson("/api/v1/notes/{$foreign->id}")->assertNotFound();
    $this->patchJson("/api/v1/notes/{$foreign->id}", ['title' => 'X'])->assertNotFound();
    $this->deleteJson("/api/v1/notes/{$foreign->id}")->assertNotFound();
});

it('soft-deletes notes and keeps their tag links for a restore', function () {
    $note = Note::factory()->for($this->user)->create();
    $note->tags()->attach(Tag::factory()->for($this->user)->create());

    $this->deleteJson("/api/v1/notes/{$note->id}")->assertNoContent();

    expect($note->fresh()->trashed())->toBeTrue()
        ->and($note->tags()->count())->toBe(1);

    $note->forceDelete();
    expect(DB::table('taggables')->count())->toBe(0);
});

it('stores the polymorphic type as a short alias', function () {
    $note = Note::factory()->for($this->user)->create();
    $note->tags()->attach(Tag::factory()->for($this->user)->create());

    expect(DB::table('taggables')->value('taggable_type'))->toBe('note');
});

it('shows the user\'s own note count on the topic page', function () {
    $topic = Topic::factory()->for(Module::factory()->for(LearningPath::factory()->system()))->create();
    Note::factory()->for($this->user)->count(2)->create(['topic_id' => $topic->id]);
    Note::factory()->create(['topic_id' => $topic->id]);

    $this->getJson("/api/v1/topics/{$topic->id}")->assertOk()->assertJsonPath('data.notes_count', 2);
});
