<?php

namespace App\Http\Controllers\Api\V1\LearningPaths;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\LearningPaths\ReorderRequest;
use App\Http\Requests\V1\LearningPaths\StoreModuleRequest;
use App\Http\Requests\V1\LearningPaths\UpdateModuleRequest;
use App\Http\Resources\V1\LearningPaths\ModuleResource;
use App\Models\LearningPath;
use App\Models\Module;
use App\Services\LearningPaths\LearningContentService;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class ModuleController extends Controller
{
    public function __construct(private LearningContentService $content) {}

    public function store(StoreModuleRequest $request, LearningPath $learningPath): ModuleResource
    {
        return new ModuleResource($this->content->createModule($learningPath, $request->validated()));
    }

    public function update(UpdateModuleRequest $request, Module $module): ModuleResource
    {
        $module->update($request->validated());

        return new ModuleResource($module);
    }

    public function destroy(Module $module): Response
    {
        Gate::authorize('delete', $module);
        $this->content->deleteModule($module);

        return response()->noContent();
    }

    public function reorder(ReorderRequest $request, LearningPath $learningPath): Response
    {
        Gate::authorize('update', $learningPath);
        $this->content->reorder(Module::where('learning_path_id', $learningPath->id), $request->ids());

        return response()->noContent();
    }
}
