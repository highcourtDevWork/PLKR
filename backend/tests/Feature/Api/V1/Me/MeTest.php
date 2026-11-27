<?php

use App\Models\User;

it('requires authentication', function (string $method, string $uri) {
    $this->json($method, $uri)->assertUnauthorized();
})->with([
    ['GET', '/api/v1/me'],
    ['PATCH', '/api/v1/me/settings'],
    ['DELETE', '/api/v1/me'],
]);

it('returns the current user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->getJson('/api/v1/me')
        ->assertOk()
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.timezone', 'UTC')
        ->assertJsonMissingPath('data.password')
        ->assertJsonStructure(['data' => [
            'id', 'name', 'email', 'timezone', 'desired_retention',
            'daily_new_limit', 'daily_review_limit', 'ai_use_notes_context', 'settings',
        ]]);
});

it('updates study settings', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->patchJson('/api/v1/me/settings', [
        'timezone' => 'Asia/Kolkata',
        'desired_retention' => 0.85,
        'daily_new_limit' => 10,
        'settings' => ['theme' => 'dark'],
    ])->assertOk()->assertJsonPath('data.timezone', 'Asia/Kolkata');

    expect($user->fresh())
        ->desired_retention->toBe(0.85)
        ->daily_new_limit->toBe(10)
        ->settings->toBe(['theme' => 'dark']);
});

it('validates settings', function () {
    $this->actingAs(User::factory()->create())->patchJson('/api/v1/me/settings', [
        'timezone' => 'Mars/Olympus',
        'desired_retention' => 0.99,
        'daily_new_limit' => -1,
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['timezone', 'desired_retention', 'daily_new_limit']);
});

it('ignores fields that are not settings', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->patchJson('/api/v1/me/settings', ['email' => 'hacker@example.com'])->assertOk();

    expect($user->fresh()->email)->not->toBe('hacker@example.com');
});

it('deletes the account with the correct password', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->deleteJson('/api/v1/me', ['password' => 'password'])->assertNoContent();

    expect(User::find($user->id))->toBeNull();
});

it('refuses account deletion with a wrong password', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->deleteJson('/api/v1/me', ['password' => 'nope'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('password');

    expect(User::find($user->id))->not->toBeNull();
});
