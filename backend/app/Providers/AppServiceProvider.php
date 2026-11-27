<?php

namespace App\Providers;

use App\Models\Note;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Lazy loading, silently discarded attributes and missing attributes throw outside production (catches N+1 in tests).
        Model::shouldBeStrict(! $this->app->environment('production'));

        // Short, stable type names in polymorphic columns (taggables) instead of class names.
        Relation::enforceMorphMap([
            'note' => Note::class,
            'user' => User::class,
        ]);
    }
}
