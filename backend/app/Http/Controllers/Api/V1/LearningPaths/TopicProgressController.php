<?php

namespace App\Http\Controllers\Api\V1\LearningPaths;

use App\Enums\TopicStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\LearningPaths\UpdateTopicProgressRequest;
use App\Http\Resources\V1\LearningPaths\TopicResource;
use App\Models\Topic;
use App\Services\LearningPaths\TopicProgressService;
use Illuminate\Http\JsonResponse;

class TopicProgressController extends Controller
{
    public function update(UpdateTopicProgressRequest $request, Topic $topic, TopicProgressService $progress): JsonResponse
    {
        $saved = $progress->setStatus($request->user(), $topic, $request->enum('status', TopicStatus::class));

        return response()->json(['data' => TopicResource::progress($saved)]);
    }
}
