<?php

namespace App\Http\Controllers\Api\V1\LearningPaths;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\LearningPaths\ReorderRequest;
use App\Http\Requests\V1\LearningPaths\StoreTopicRequest;
use App\Http\Requests\V1\LearningPaths\UpdateTopicRequest;
use App\Http\Resources\V1\LearningPaths\TopicResource;
use App\Models\Module;
use App\Models\Topic;
use App\Services\LearningPaths\LearningContentService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class TopicController extends Controller
{
    public function __construct(private LearningContentService $content) {}

    public function store(StoreTopicRequest $request, Module $module): TopicResource
    {
        return new TopicResource($this->content->createTopic($module, $request->validated()));
    }

    /** Topic page: breadcrumb, the user's progress, subtopics (with progress) and own resource and note counts. */
    public function show(Request $request, Topic $topic): TopicResource
    {
        Gate::authorize('view', $topic);

        $userId = $request->user()->id;
        $forUser = fn ($query) => $query->where('user_id', $userId);

        $topic->load([
            'module.learningPath',
            'parent',
            'progress' => $forUser,
            'children.progress' => $forUser,
        ])->loadCount(['resources' => $forUser, 'notes' => $forUser]);

        return new TopicResource($topic);
    }

    public function update(UpdateTopicRequest $request, Topic $topic): TopicResource
    {
        $topic->update($request->validated());

        return new TopicResource($topic);
    }

    public function destroy(Topic $topic): Response
    {
        Gate::authorize('delete', $topic);
        $this->content->deleteTopic($topic);

        return response()->noContent();
    }

    /** Reorders sibling topics: either the module's top-level topics or the subtopics of one topic. */
    public function reorder(ReorderRequest $request, Module $module): Response
    {
        Gate::authorize('update', $module);
        $ids = $request->ids();

        $parentIds = Topic::where('module_id', $module->id)->whereIn('id', $ids)->distinct()->pluck('parent_id');
        if ($parentIds->count() !== 1) {
            throw ValidationException::withMessages(['ids' => 'All topics must share the same parent.']);
        }

        $this->content->reorder(
            Topic::where('module_id', $module->id)->where('parent_id', $parentIds->first()),
            $ids,
        );

        return response()->noContent();
    }
}
