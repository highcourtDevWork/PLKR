<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
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
    }
}
