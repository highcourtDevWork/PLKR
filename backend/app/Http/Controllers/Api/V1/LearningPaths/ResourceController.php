<?php

namespace App\Http\Controllers\Api\V1\LearningPaths;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\LearningPaths\StoreResourceRequest;
use App\Http\Requests\V1\LearningPaths\UpdateResourceRequest;
use App\Http\Resources\V1\LearningPaths\ResourceResource;
use App\Models\LearningResource;
use App\Models\Topic;
use App\Services\LearningPaths\LearningContentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

/** Resources are private to their owner, so lists only contain the user's own. */
class ResourceController extends Controller
{
    public function __construct(private LearningContentService $content) {}

    public function index(Request $request, Topic $topic): AnonymousResourceCollection
    {
        Gate::authorize('view', $topic);

        return ResourceResource::collection(
            $topic->resources()->where('user_id', $request->user()->id)->get()
        );
    }

    public function store(StoreResourceRequest $request, Topic $topic): ResourceResource
    {
        return new ResourceResource($this->content->createResource($request->user(), $topic, $request->validated()));
    }

    public function update(UpdateResourceRequest $request, LearningResource $resource): ResourceResource
    {
        $resource->update($request->validated());

        return new ResourceResource($resource);
    }

    public function destroy(LearningResource $resource): Response
    {
        Gate::authorize('delete', $resource);
        $resource->delete();

        return response()->noContent();
    }
}
