<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'google_id')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->string('google_id')->nullable()->after('email');
            });
        }

        if (! Schema::hasIndex('users', ['google_id'], 'unique')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->unique('google_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasIndex('users', ['google_id'], 'unique')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropUnique(['google_id']);
            });
        }

        if (Schema::hasColumn('users', 'google_id')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropColumn('google_id');
            });
        }
    }
};
