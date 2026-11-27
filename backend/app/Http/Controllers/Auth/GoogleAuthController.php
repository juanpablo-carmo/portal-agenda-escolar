<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Google\Client as GoogleClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class GoogleAuthController extends Controller
{
    public function config(): JsonResponse
    {
        return response()->json([
            'clientId' => config('services.google.client_id'),
        ]);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'credential' => ['required', 'string', 'max:8192'],
        ]);

        $clientId = config('services.google.client_id');
        if (! $clientId) {
            return response()->json(['message' => 'Google login is not configured.'], 503);
        }

        try {
            $google = new GoogleClient(['client_id' => $clientId]);
            $claims = $google->verifyIdToken($validated['credential']);
        } catch (Throwable $exception) {
            report($exception);
            $claims = false;
        }

        if (! $claims || empty($claims['sub']) || empty($claims['email']) || ($claims['email_verified'] ?? false) !== true) {
            return response()->json(['message' => 'The Google credential is invalid or the email is not verified.'], 401);
        }

        $configuredAdminEmail = Str::lower(trim((string) config('services.auth.admin_email')));
        $user = DB::transaction(function () use ($claims, $configuredAdminEmail): User {
            $user = User::query()->where('google_id', $claims['sub'])->first();

            if (! $user) {
                // A verified Google email may be linked to an existing local account.
                $user = User::query()->where('email', $claims['email'])->first();
            }

            if (! $user) {
                $user = new User([
                    'name' => $claims['name'] ?? Str::before($claims['email'], '@'),
                    'email' => $claims['email'],
                    'password' => Str::random(64),
                ]);
                $user->email_verified_at = now();
            }

            $user->google_id = $claims['sub'];
            if ($configuredAdminEmail !== '' && Str::lower($user->email) === $configuredAdminEmail) {
                $user->role = User::ROLE_ADMIN;
            } elseif (! $user->role) {
                $user->role = User::ROLE_PENDING;
            }
            $user->save();

            return $user;
        });

        $accessToken = $user->createToken('portal-agenda-web', ['*'], now()->addDays(7));

        return response()->json([
            'token' => $accessToken->plainTextToken,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $configuredAdminEmail = Str::lower(trim((string) config('services.auth.admin_email')));

        if ($configuredAdminEmail !== '' && Str::lower($user->email) === $configuredAdminEmail && $user->role !== User::ROLE_ADMIN) {
            $user->role = User::ROLE_ADMIN;
            $user->save();
        }

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out.']);
    }
}
