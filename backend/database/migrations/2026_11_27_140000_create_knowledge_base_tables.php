<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Knowledge base (Module C): Markdown notes and per-user tags. See docs/erd.md.
 * taggables is polymorphic (notes now, questions from Phase 3); keys are morph aliases set in AppServiceProvider.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('topic_id')->nullable()->constrained()->nullOnDelete(); // unfiled notes allowed
            $table->string('title', 200);
            $table->string('kind', 32)->default('general');
            $table->mediumText('body');
            $table->boolean('is_pinned')->default(false);
            $table->string('source', 16)->default('manual');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'topic_id']);
            $table->index(['user_id', 'is_pinned', 'updated_at']); // the list order: pinned first, then newest
            $table->fullText(['title', 'body']);
        });

        Schema::create('tags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 50);
            $table->string('slug', 60);
            $table->timestamps();

            $table->unique(['user_id', 'slug']);
        });

        Schema::create('taggables', function (Blueprint $table) {
            $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
            $table->string('taggable_type', 64);
            $table->unsignedBigInteger('taggable_id');

            $table->primary(['tag_id', 'taggable_type', 'taggable_id']);
            $table->index(['taggable_type', 'taggable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('taggables');
        Schema::dropIfExists('tags');
        Schema::dropIfExists('notes');
    }
};
