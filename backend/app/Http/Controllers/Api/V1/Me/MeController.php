<?php

namespace App\Http\Controllers\Api\V1\Me;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Me\DeleteAccountRequest;
use App\Http\Resources\V1\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class MeController extends Controller
{
    public function show(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function destroy(DeleteAccountRequest $request): Response
    {
        $user = $request->user();

        Auth::guard('web')->logout();

        // Sanctum only starts a session for requests from the SPA's stateful domain.
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        // User-owned rows are removed by cascading foreign keys.
        $user->delete();

        return response()->noContent();
    }
}
