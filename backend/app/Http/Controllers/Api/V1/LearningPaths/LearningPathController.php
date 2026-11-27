<?php

namespace App\Http\Controllers\Api\V1\LearningPaths;

use App\Enums\TopicStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\LearningPaths\ReorderRequest;
use App\Http\Requests\V1\LearningPaths\StoreLearningPathRequest;
use App\Http\Requests\V1\LearningPaths\UpdateLearningPathRequest;
use App\Http\Resources\V1\LearningPaths\LearningPathResource;
use App\Models\LearningPath;
use App\Services\LearningPaths\LearningContentService;
use App\Services\LearningPaths\LearningPathTree;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class LearningPathController extends Controller
{
    public function __construct(private LearningContentService $content) {}

    /** Own and system paths with module/topic counts and the user's completed-topic count. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $paths = QueryBuilder::for(LearningPath::visibleTo($user))
            ->allowedFilters(
                AllowedFilter::partial('title'),
                AllowedFilter::callback('is_system', fn (Builder $query, mixed $value) => filter_var($value, FILTER_VALIDATE_BOOLEAN)
                    ? $query->whereNull('user_id')
                    : $query->where('user_id', $user->id)),
            )
            ->allowedSorts('position', 'title', 'created_at', 'updated_at')
            ->defaultSort('position')
            ->withCount([
                'modules',
                'topics',
                'topics as completed_topics_count' => fn (Builder $query) => $query->whereHas(
                    'progress',
                    fn (Builder $q) => $q->where('user_id', $user->id)->where('status', TopicStatus::Completed),
                ),
            ])
            ->paginate(max(1, min($request->integer('per_page', 20), 100)))
            ->withQueryString();

        return LearningPathResource::collection($paths);
    }

    public function store(StoreLearningPathRequest $request): LearningPathResource
    {
        return new LearningPathResource($this->content->createPath($request->user(), $request->validated()));
    }

    /** The path with its full module → topic → subtopic tree and the user's progress. */
    public function show(Request $request, LearningPath $learningPath, LearningPathTree $tree): LearningPathResource
    {
        Gate::authorize('view', $learningPath);

        return new LearningPathResource($tree->load($learningPath, $request->user()));
    }

    public function update(UpdateLearningPathRequest $request, LearningPath $learningPath): LearningPathResource
    {
        $learningPath->update($request->validated());

        return new LearningPathResource($learningPath);
    }

    public function destroy(LearningPath $learningPath): Response
    {
        Gate::authorize('delete', $learningPath);
        $this->content->deletePath($learningPath);

        return response()->noContent();
    }

    /** Reorders the user's own paths. */
    public function reorder(ReorderRequest $request): Response
    {
        $this->content->reorder(LearningPath::where('user_id', $request->user()->id), $request->ids());

        return response()->noContent();
    }
}
