<?php

namespace App\Http\Controllers\Api\V1\Me;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Me\UpdateSettingsRequest;
use App\Http\Resources\V1\UserResource;

class SettingsController extends Controller
{
    public function update(UpdateSettingsRequest $request): UserResource
    {
        $user = $request->user();
        $user->update($request->validated());

        return new UserResource($user);
    }
}
