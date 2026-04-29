<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AiController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BulkImportController;
use App\Http\Controllers\ConceptController;
use App\Http\Controllers\CouponController;
use App\Http\Controllers\DomainController;
use App\Http\Controllers\ExamPrepController;
use App\Http\Controllers\FlashcardController;
use App\Http\Controllers\GamificationController;
use App\Http\Controllers\LearningController;
use App\Http\Controllers\MemoryController;
use App\Http\Controllers\NotesController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\PrivacyController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\StudyController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\TopicController;
use App\Http\Controllers\ContentLibraryController;
use App\Http\Controllers\TopicExtraController;
use App\Http\Controllers\UploadController;
use Illuminate\Support\Facades\Route;

// ─── Auth ──────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);

    Route::middleware('legacy.auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me',      [AuthController::class, 'me']);
        Route::post('verify-email',        [AuthController::class, 'verifyEmail']);
        Route::post('resend-verification', [AuthController::class, 'resendVerification']);
    });
});

// ─── Admin (users + dashboard) ─────────────────────────────
Route::prefix('admin')->middleware('legacy.auth')->group(function () {
    Route::get('dashboard-stats', [AdminController::class, 'dashboardStats']);
    Route::get('users',           [AdminController::class, 'listUsers']);
    Route::post('users',          [AdminController::class, 'createUser']);
    Route::patch('users/role',    [AdminController::class, 'updateRole']);
    Route::patch('users/{id}',           [AdminController::class, 'updateUser'])->whereNumber('id');
    Route::post('users/{id}/password',   [AdminController::class, 'resetPassword'])->whereNumber('id');
    Route::post('users/{id}/subscription',[AdminController::class, 'setSubscription'])->whereNumber('id');
    Route::post('users/{id}/impersonate', [AdminController::class, 'impersonate'])->whereNumber('id');
    Route::delete('users/{id}',          [AdminController::class, 'deleteUser'])->whereNumber('id');

    // Content Library
    Route::get('content',                  [ContentLibraryController::class, 'index']);
    Route::post('content/upload',          [ContentLibraryController::class, 'upload']);
    Route::post('content/bulk',            [ContentLibraryController::class, 'bulk']);
    Route::get('content/search',           [ContentLibraryController::class, 'search']);
    Route::get('content/{id}',             [ContentLibraryController::class, 'show'])->whereNumber('id');
    Route::patch('content/{id}',           [ContentLibraryController::class, 'update'])->whereNumber('id');
    Route::post('content/{id}/reprocess',  [ContentLibraryController::class, 'reprocess'])->whereNumber('id');
    Route::delete('content/{id}',          [ContentLibraryController::class, 'destroy'])->whereNumber('id');

    // AI-assisted topic authoring (uses Content Library as context when available)
    Route::post('topics/generate-with-ai', [AiController::class, 'generateTopic']);

    // Item-bank calibration (Track 2 — psychometrics)
    Route::get('quizzes/{id}/calibration', [QuizController::class, 'calibration'])->whereNumber('id');
});

// ─── Public reads ──────────────────────────────────────────
Route::get('/domains',         [DomainController::class, 'index']);
Route::get('/topics',          [TopicController::class, 'index']);
Route::get('/topics/{id}',     [TopicController::class, 'show'])->whereNumber('id');
Route::get('/flashcards',      [FlashcardController::class, 'index']);
Route::get('/quizzes',         [QuizController::class, 'index']);
Route::get('/concepts',        [ConceptController::class, 'index']);
Route::get('/topic-extras',    [TopicExtraController::class, 'index']);
Route::get('/topics/{topicId}/learning-steps', [LearningController::class, 'index'])->whereNumber('topicId');

// ─── Exam prep — public reads ──────────────────────────────
Route::get('/calculations',     [ExamPrepController::class, 'calculations']);
Route::get('/critical-numbers', [ExamPrepController::class, 'criticalNumbers']);
Route::get('/regulations',      [ExamPrepController::class, 'regulations']);
Route::get('/formula-guide',    [ExamPrepController::class, 'formulaGuide']);

// ─── Admin-protected writes ────────────────────────────────
Route::middleware('legacy.auth')->group(function () {
    // Topics
    Route::post('/topics',         [TopicController::class, 'store']);
    Route::patch('/topics/{id}',   [TopicController::class, 'update'])->whereNumber('id');
    Route::delete('/topics/{id}',  [TopicController::class, 'destroy'])->whereNumber('id');

    // Concepts
    Route::post('/concepts',         [ConceptController::class, 'store']);
    Route::patch('/concepts/{id}',   [ConceptController::class, 'update'])->whereNumber('id');
    Route::delete('/concepts/{id}',  [ConceptController::class, 'destroy'])->whereNumber('id');

    // Topic extras (mnemonic, examtip, formula, regulation, chapter, diagram)
    Route::post('/topic-extras',         [TopicExtraController::class, 'store']);
    Route::patch('/topic-extras/{id}',   [TopicExtraController::class, 'update'])->whereNumber('id');
    Route::delete('/topic-extras/{id}',  [TopicExtraController::class, 'destroy'])->whereNumber('id');

    // Learning steps (10-step flow per topic) — admin upsert/delete
    Route::put('/topics/{topicId}/learning-steps/{stepType}',    [LearningController::class, 'upsert'])->whereNumber('topicId');
    Route::delete('/topics/{topicId}/learning-steps/{stepType}', [LearningController::class, 'destroy'])->whereNumber('topicId');

    // Flashcards
    Route::post('/flashcards',         [FlashcardController::class, 'store']);
    Route::patch('/flashcards/{id}',   [FlashcardController::class, 'update'])->whereNumber('id');
    Route::delete('/flashcards/{id}',  [FlashcardController::class, 'destroy'])->whereNumber('id');

    // Quizzes
    Route::post('/quizzes',         [QuizController::class, 'store']);
    Route::patch('/quizzes/{id}',   [QuizController::class, 'update'])->whereNumber('id');
    Route::delete('/quizzes/{id}',  [QuizController::class, 'destroy'])->whereNumber('id');

    // Coupons (superadmin)
    Route::get('/coupons',          [CouponController::class, 'index']);
    Route::post('/coupons',         [CouponController::class, 'store']);
    Route::post('/coupons/gift',    [CouponController::class, 'generateGift']);
    Route::patch('/coupons/{id}',   [CouponController::class, 'update'])->whereNumber('id');
    Route::delete('/coupons/{id}',  [CouponController::class, 'destroy'])->whereNumber('id');

    // Analytics (superadmin)
    Route::get('/analytics/overview', [AnalyticsController::class, 'overview']);
    Route::get('/admin/topics/completeness', [AnalyticsController::class, 'topicCompleteness']);

    // Settings (superadmin)
    Route::get('/settings',  [SettingsController::class, 'index']);
    Route::patch('/settings', [SettingsController::class, 'update']);

    // Subscriptions & payments (superadmin)
    Route::get('/subscriptions',          [SubscriptionController::class, 'index']);
    Route::get('/payments',               [SubscriptionController::class, 'payments']);
    Route::post('/payments/{id}/refund',  [SubscriptionController::class, 'refund'])->whereNumber('id');

    // Student study (any logged-in user)
    Route::post('/study/review',       [StudyController::class, 'review']);
    Route::get('/study/due',           [StudyController::class, 'due']);
    Route::get('/study/stats',         [StudyController::class, 'stats']);
    Route::get('/study/gamification',  [StudyController::class, 'gamification']);
    Route::get('/study/readiness',     [StudyController::class, 'readiness']);
    Route::get('/study/revision-queue', [StudyController::class, 'revisionQueue']);
    Route::get('/study/recommendation', [StudyController::class, 'recommendation']);
    Route::post('/study/quiz-attempt', [StudyController::class, 'quizAttempt']);
    Route::post('/study/learning-event', [StudyController::class, 'learningEvent']);

    // Memory engine
    Route::get('/memory/dashboard', [MemoryController::class, 'dashboard']);
    Route::get('/memory/due-reviews', [MemoryController::class, 'dueReviews']);
    Route::get('/memory/concepts/{conceptId}/profile', [MemoryController::class, 'conceptProfile'])->whereNumber('conceptId');
    Route::post('/memory/flashcards/{flashcardId}/review', [MemoryController::class, 'submitFlashcardReview'])->whereNumber('flashcardId');
    Route::get('/memory/daily-queue', [MemoryController::class, 'dailyQueue']);
    Route::get('/memory/retention-analytics', [MemoryController::class, 'retentionAnalytics']);
    Route::get('/memory/weak-concepts', [MemoryController::class, 'weakConcepts']);
    // Track 5 — image occlusion drill cards (visual SRS, not yet wired to per-card grading)
    Route::get('/memory/occlusion-cards', [MemoryController::class, 'occlusionCards']);

    // ─── Mastery Library (premium-gated) ──────────────────────
    Route::middleware('mastery.access')->prefix('mastery')->group(function () {
        Route::get('categories',                 [\App\Http\Controllers\MasteryController::class, 'categories']);
        Route::get('topics',                     [\App\Http\Controllers\MasteryController::class, 'topicsIndex']);
        Route::get('topics/{masteryId}',         [\App\Http\Controllers\MasteryController::class, 'topicShow']);
        Route::get('topics/{masteryId}/items',   [\App\Http\Controllers\MasteryController::class, 'items']);
        Route::post('topics/{masteryId}/progress',[\App\Http\Controllers\MasteryController::class, 'recordProgress']);
    });

    // Gamification system
    Route::get('/gamification/profile', [GamificationController::class, 'profile']);
    Route::get('/gamification/xp-history', [GamificationController::class, 'xpHistory']);
    Route::get('/gamification/streak', [GamificationController::class, 'streak']);
    Route::get('/gamification/badges', [GamificationController::class, 'badges']);
    Route::get('/gamification/missions', [GamificationController::class, 'missions']);
    Route::post('/gamification/missions/{userMissionId}/claim', [GamificationController::class, 'claimMission'])->whereNumber('userMissionId');
    Route::get('/gamification/achievements', [GamificationController::class, 'achievements']);
    Route::get('/gamification/leaderboard', [GamificationController::class, 'leaderboard']);
    Route::post('/gamification/activity', [GamificationController::class, 'activity']);

    // AI (Feynman teach-back + Smart Study Tools)
    Route::post('/ai/feynman',       [AiController::class, 'feynman']);
    Route::post('/ai/explain',       [AiController::class, 'explain']);
    Route::post('/ai/generate-quiz', [AiController::class, 'generateQuiz']);
    Route::post('/ai/generate-discussion', [AiController::class, 'generateDiscussion']);
    Route::post('/ai/generate-image',      [AiController::class, 'generateImage']);

    // Flagged quizzes (per user)
    Route::get('/flagged',                  [ExamPrepController::class, 'flagged']);
    Route::post('/flagged',                 [ExamPrepController::class, 'flag']);
    Route::delete('/flagged/{quizId}',      [ExamPrepController::class, 'unflag'])->whereNumber('quizId');

    // Activity log (superadmin)
    Route::get('/activity-log',             [ActivityLogController::class, 'index']);

    // Image uploads (admin)
    Route::post('/uploads/image',           [UploadController::class, 'image']);

    // Study plan + confusion map
    Route::get('/study-plan',               [PlanController::class, 'show']);
    Route::post('/study-plan',              [PlanController::class, 'generate']);
    Route::delete('/study-plan',            [PlanController::class, 'destroy']);
    Route::get('/confusion-map',            [PlanController::class, 'confusion']);

    // Bulk CSV import (superadmin)
    Route::post('/bulk-import/preview',     [BulkImportController::class, 'preview']);
    Route::post('/bulk-import/users',       [BulkImportController::class, 'importUsers']);
    Route::post('/bulk-import/flashcards',  [BulkImportController::class, 'importFlashcards']);
    Route::post('/bulk-import/quizzes',     [BulkImportController::class, 'importQuizzes']);

    // Universal user notes (polymorphic per ref_type+ref_id)
    Route::get('/notes',         [NotesController::class, 'index']);
    Route::put('/notes',         [NotesController::class, 'upsert']);
    Route::delete('/notes/{id}', [NotesController::class, 'destroy'])->whereNumber('id');

    // Privacy and data subject requests
    Route::get('/privacy/export',           [PrivacyController::class, 'export']);
    Route::post('/privacy/delete-request',  [PrivacyController::class, 'deleteRequest']);
    Route::get('/privacy/requests',         [PrivacyController::class, 'requests']);
    Route::patch('/privacy/requests/{id}',  [PrivacyController::class, 'updateRequest'])->whereNumber('id');
});

Route::get('/health', fn () => response()->json(['ok' => true, 'service' => 'IntelliCert API']));

// ─── Public TTS (no auth — audio streams via <audio src>) ────────────
Route::post('/ai/tts',       [AiController::class, 'tts']);
Route::get('/ai/tts/voices', [AiController::class, 'ttsVoices']);
