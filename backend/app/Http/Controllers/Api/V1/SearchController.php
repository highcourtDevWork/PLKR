<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Notes\NoteResource;
use App\Models\Note;
use App\Models\Topic;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Global search (⌘K): a few top results per group. Notes use the FULLTEXT index; topics match
 * on title among the paths the user can see. Questions join in Phase 3.
 */
class SearchController extends Controller
{
    private const PER_GROUP = 5;

    public function __invoke(Request $request): JsonResponse
    {
        $q = (string) $request->validate(['q' => ['required', 'string', 'max:100']])['q'];
        $user = $request->user();

        $notes = Note::query()
            ->where('user_id', $user->id)
            ->select(['id', 'topic_id', 'title', 'kind', 'is_pinned', 'source', 'created_at', 'updated_at'])
            ->selectRaw('SUBSTRING(body, 1, 160) AS excerpt')
            ->search($q)
            ->limit(self::PER_GROUP)
            ->get();

        $topics = Topic::query()
            ->whereLike('title', Note::containsPattern($q))
            ->whereHas('module.learningPath', fn (Builder $path) => $path->visibleTo($user))
            ->with(['module:id,learning_path_id', 'module.learningPath:id,title'])
            ->orderBy('title')
            ->limit(self::PER_GROUP)
            ->get(['id', 'module_id', 'title']);

        return response()->json(['data' => [
            'notes' => NoteResource::collection($notes),
            'topics' => $topics->map(fn (Topic $t) => [
                'id' => $t->id,
                'title' => $t->title,
                'learning_path' => ['id' => $t->module->learningPath->id, 'title' => $t->module->learningPath->title],
            ]),
        ]]);
    }
}
