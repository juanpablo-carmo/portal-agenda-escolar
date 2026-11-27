<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::query()
            ->orderByRaw("CASE role WHEN 'pendente' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'created_at']);

        return response()->json($users);
    }

    public function updateRole(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', 'in:pendente,leitor,editor,administrador'],
        ]);

        if ($request->user()->is($user) && $validated['role'] !== User::ROLE_ADMIN) {
            return response()->json([
                'message' => 'Você não pode remover sua própria permissão de administrador.',
            ], 422);
        }

        if (
            $user->role === User::ROLE_ADMIN
            && $validated['role'] !== User::ROLE_ADMIN
            && User::query()->where('role', User::ROLE_ADMIN)->count() <= 1
        ) {
            return response()->json([
                'message' => 'O sistema precisa manter pelo menos um administrador.',
            ], 422);
        }

        $user->role = $validated['role'];
        $user->save();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'created_at' => $user->created_at,
        ]);
    }
}
