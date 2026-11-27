<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AgendaController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Auth\PermissionController;
use App\Http\Controllers\RespostaController;
use App\Http\Controllers\RelatorioController;
use App\Models\Perfil;

Route::get('/auth/config', [GoogleAuthController::class, 'config']);
Route::post('/auth/google', [GoogleAuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ]);
    });
    Route::get('/auth/me', [GoogleAuthController::class, 'me']);
    Route::post('/auth/logout', [GoogleAuthController::class, 'logout']);

    Route::middleware('role:administrador')->group(function (): void {
        Route::get('/auth/users', [PermissionController::class, 'index']);
        Route::patch('/auth/users/{user}/role', [PermissionController::class, 'updateRole']);
        Route::get('/relatorios/resumo-dsa/{id}', [RelatorioController::class, 'consultarResumoDsa']);
        Route::get('/relatorios/resumo-dsa/{id}/download', [RelatorioController::class, 'baixarResumoDsa']);
        Route::post('/relatorios/solicitar-resumo-dsa', [RelatorioController::class, 'solicitarResumoDsa']);
        Route::delete('/agendas/{id}', [AgendaController::class, 'destroy']);
    });

    Route::middleware('role:editor,administrador')->group(function (): void {
        Route::get('/perfis', function () {
            return response()->json(Perfil::query()->orderBy('nome')->get());
        });
        Route::post('/agendas', [AgendaController::class, 'store']);
        Route::get('/agendas/{id}/respostas', [RespostaController::class, 'index']);
    });

    Route::middleware('role:leitor,editor,administrador')->group(function (): void {
        Route::get('/agendas', [AgendaController::class, 'index']);
        Route::post('/agendas/{id}/respostas', [RespostaController::class, 'store']);
    });
});

