<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ActivityLogController extends Controller
{
    private function requireSuperadmin(Request $request): ?JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        if (!$user || $user->role !== 'superadmin') {
            return response()->json(['success' => false, 'error' => 'Superadmin access required'], 403);
        }
        return null;
    }

    public function index(Request $request): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;

        if (!Schema::hasTable('activity_log')) {
            return response()->json(['success' => true, 'logs' => [], 'total' => 0]);
        }

        $entityType = $request->input('entity_type');
        $action     = $request->input('action');
        $limit      = min(500, max(10, (int) $request->input('limit', 100)));

        $q = DB::table('activity_log')->orderByDesc('id')->limit($limit);
        if ($entityType) $q->where('entity_type', $entityType);
        if ($action)     $q->where('action', $action);

        $logs = $q->get();

        // Surface filter dropdown options
        $entityTypes = DB::table('activity_log')->select('entity_type')->distinct()->whereNotNull('entity_type')->pluck('entity_type');
        $actions     = DB::table('activity_log')->select('action')->distinct()->pluck('action');

        return response()->json([
            'success'      => true,
            'logs'         => $logs,
            'total'        => $logs->count(),
            'entity_types' => $entityTypes,
            'actions'      => $actions,
        ]);
    }
}
