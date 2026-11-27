<?php

namespace App\Http\Controllers\Api\V1\Notes;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Tags\TagRequest;
use App\Http\Resources\V1\Notes\TagResource;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

/** All of the user's tags at once (a personal tag list stays small), with how many notes use each. */
class TagController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return TagResource::collection(
            $request->user()->tags()->withCount('notes')->orderBy('name')->get()
        );
    }

    public function store(TagRequest $request): TagResource
    {
        return new TagResource($request->user()->tags()->create($request->validated()));
    }

    public function update(TagRequest $request, Tag $tag): TagResource
    {
        $tag->update($request->validated());

        return new TagResource($tag);
    }

    /** Removes the tag from everything it was on (taggables cascade). */
    public function destroy(Tag $tag): Response
    {
        Gate::authorize('delete', $tag);
        $tag->delete();

        return response()->noContent();
    }
}
