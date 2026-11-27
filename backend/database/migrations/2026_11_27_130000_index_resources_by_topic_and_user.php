<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Resources are private but attach to shared system topics, so every read filters by topic AND user
 * (list ordered by position, count, next position). Index that combination instead of (topic_id, position).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resources', function (Blueprint $table) {
            $table->index(['topic_id', 'user_id', 'position']);
            $table->dropIndex(['topic_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::table('resources', function (Blueprint $table) {
            $table->index(['topic_id', 'position']);
            $table->dropIndex(['topic_id', 'user_id', 'position']);
        });
    }
};
