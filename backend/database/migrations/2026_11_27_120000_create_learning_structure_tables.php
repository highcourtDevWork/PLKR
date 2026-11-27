<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Learning content (Module B): paths → modules → topics (→ subtopics) and resources.
 * Content only: per-user progress lives in user_topic_progress. See docs/erd.md.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('learning_paths', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete(); // null = system content
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->string('level', 32);
            $table->string('color', 32)->nullable();
            $table->string('icon', 32)->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'position']);
        });

        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('learning_path_id')->constrained()->cascadeOnDelete();
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->string('level', 32)->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['learning_path_id', 'position']);
        });

        Schema::create('topics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('topics')->cascadeOnDelete();
            $table->string('title', 150);
            $table->text('summary')->nullable();
            $table->string('level', 32);
            $table->unsignedSmallInteger('estimated_minutes')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['module_id', 'parent_id', 'position']);
        });

        Schema::create('resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('topic_id')->constrained()->cascadeOnDelete();
            $table->string('type', 32);
            $table->string('title', 200);
            $table->string('url', 2048);
            $table->text('description')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['topic_id', 'position']);
        });

        Schema::create('user_topic_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('topic_id')->constrained()->cascadeOnDelete();
            $table->string('status', 16)->default('not_started');
            $table->decimal('mastery', 5, 2)->default(0);
            $table->decimal('retention', 5, 4)->nullable();
            $table->decimal('accuracy', 5, 4)->nullable();
            $table->decimal('coverage', 5, 4)->nullable();
            $table->dateTime('last_studied_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'topic_id']);
            $table->index(['user_id', 'mastery']);
            $table->index(['user_id', 'last_studied_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_topic_progress');
        Schema::dropIfExists('resources');
        Schema::dropIfExists('topics');
        Schema::dropIfExists('modules');
        Schema::dropIfExists('learning_paths');
    }
};
