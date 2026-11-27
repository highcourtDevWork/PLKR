<?php

namespace App\Http\Controllers\Api\V1\Notes;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Notes\StoreNoteRequest;
use App\Http\Requests\V1\Notes\UpdateNoteRequest;
use App\Http\Resources\V1\Notes\NoteResource;
use App\Models\Note;
use App\Services\Notes\NoteService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class NoteController extends Controller
{
    public function __construct(private NoteService $notes) {}

    /** The user's notes, pinned first. Bodies are replaced by a 300-character excerpt. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $base = Note::query()
            ->where('user_id', $request->user()->id)
            ->select(['id', 'user_id', 'topic_id', 'title', 'kind', 'is_pinned', 'source', 'created_at', 'updated_at'])
            ->selectRaw('SUBSTRING(body, 1, 300) AS excerpt')
            ->with(['topic:id,title', 'tags:id,name,slug'])
            ->orderByDesc('is_pinned');

        $notes = QueryBuilder::for($base)
            ->allowedFilters(
                AllowedFilter::exact('topic_id'),
                AllowedFilter::exact('kind'),
                AllowedFilter::callback('tag_id', fn (Builder $q, mixed $id) => $q->whereHas('tags', fn (Builder $t) => $t->whereKey($id))),
                AllowedFilter::callback('pinned', fn (Builder $q, mixed $v) => $q->where('is_pinned', filter_var($v, FILTER_VALIDATE_BOOLEAN))),
                AllowedFilter::callback('q', fn (Builder $q, mixed $term) => $q->scopes(['search' => [(string) $term]])),
            )
            ->allowedSorts('updated_at', 'created_at', 'title')
            ->defaultSort('-updated_at')
            ->paginate(max(1, min($request->integer('per_page', 20), 100)))
            ->withQueryString();

        return NoteResource::collection($notes);
    }

    public function store(StoreNoteRequest $request): NoteResource
    {
        return new NoteResource($this->notes->create($request->user(), $request->validated()));
    }

    public function show(Note $note): NoteResource
    {
        Gate::authorize('view', $note);

        return new NoteResource($note->load(['topic', 'tags']));
    }

    public function update(UpdateNoteRequest $request, Note $note): NoteResource
    {
        return new NoteResource($this->notes->update($note, $request->validated()));
    }

    public function destroy(Note $note): Response
    {
        Gate::authorize('delete', $note);
        $note->delete();

        return response()->noContent();
    }
}
