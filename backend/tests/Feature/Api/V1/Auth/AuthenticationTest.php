<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Notification;

it('registers a user and starts a session', function () {
    $this->postJson('/api/v1/auth/register', [
        'name' => 'Ada',
        'email' => 'ada@example.com',
        'password' => 'Secret-pass-123',
        'password_confirmation' => 'Secret-pass-123',
    ])->assertCreated();

    $this->assertAuthenticated();
    expect(User::where('email', 'ada@example.com')->first())
        ->timezone->toBe('UTC')
        ->desired_retention->toBe(0.9);
});

it('validates registration input', function () {
    $this->postJson('/api/v1/auth/register', ['email' => 'not-an-email'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'email', 'password']);
});

it('logs in with valid credentials', function () {
    $user = User::factory()->create();

    $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'password'])
        ->assertOk();

    $this->assertAuthenticatedAs($user);
});

it('rejects invalid credentials', function () {
    $user = User::factory()->create();

    $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'wrong'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');

    $this->assertGuest();
});

it('throttles repeated login attempts', function () {
    $user = User::factory()->create();

    foreach (range(1, 5) as $_) {
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'wrong']);
    }

    $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'wrong'])
        ->assertTooManyRequests();
});

it('logs out', function () {
    $this->actingAs(User::factory()->create());

    $this->postJson('/api/v1/auth/logout')->assertNoContent();

    $this->assertGuest('web');
});

it('sends a password reset link that points to the frontend', function () {
    Notification::fake();
    $user = User::factory()->create();

    $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertOk();

    Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user) {
        $url = $notification->toMail($user)->actionUrl;

        return str_starts_with($url, config('app.frontend_url').'/reset-password?token=');
    });
});
