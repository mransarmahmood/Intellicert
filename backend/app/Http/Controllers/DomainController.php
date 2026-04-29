<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use Illuminate\Http\JsonResponse;

class DomainController extends Controller
{
    public function index(): JsonResponse
    {
        $domains = Domain::orderBy('number')->get();
        return response()->json([
            'success' => true,
            'domains' => $domains,
        ]);
    }
}
