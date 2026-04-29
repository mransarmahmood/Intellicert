<?php

namespace App\Http\Controllers;

use App\Models\Flashcard;
use App\Models\Quiz;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BulkImportController extends Controller
{
    private function requireSuperadmin(Request $request): ?JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        if (!$user || $user->role !== 'superadmin') {
            return response()->json(['success' => false, 'error' => 'Superadmin access required'], 403);
        }
        return null;
    }

    /**
     * Read an uploaded CSV and return [headerRow, dataRows].
     */
    private function readCsv(Request $request): array
    {
        $file = $request->file('csv_file');
        if (!$file) {
            abort(response()->json(['success' => false, 'error' => 'CSV file is required'], 400));
        }
        if (strtolower($file->getClientOriginalExtension()) !== 'csv') {
            abort(response()->json(['success' => false, 'error' => 'Only CSV files are allowed'], 400));
        }

        $handle = fopen($file->getRealPath(), 'r');
        if (!$handle) {
            abort(response()->json(['success' => false, 'error' => 'Failed to read CSV'], 500));
        }

        $header = fgetcsv($handle);
        if (!$header) {
            fclose($handle);
            abort(response()->json(['success' => false, 'error' => 'Empty CSV file'], 400));
        }
        $header = array_map(fn ($h) => strtolower(trim(str_replace("\xEF\xBB\xBF", '', $h))), $header);

        $rows = [];
        while (($row = fgetcsv($handle)) !== false) {
            // Skip blank lines
            if (!$row || (count($row) === 1 && trim($row[0] ?? '') === '')) continue;
            $rows[] = $row;
        }
        fclose($handle);

        return [$header, $rows];
    }

    public function preview(Request $request): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;
        [$header, $rows] = $this->readCsv($request);
        return response()->json([
            'success'      => true,
            'headers'      => $header,
            'preview_rows' => array_slice($rows, 0, 5),
            'total_rows'   => count($rows),
        ]);
    }

    public function importUsers(Request $request): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;
        [$header, $rows] = $this->readCsv($request);

        $cols = array_flip($header);
        if (!isset($cols['email'], $cols['password'])) {
            return response()->json(['success' => false, 'error' => 'CSV must have email and password columns'], 400);
        }

        $existingEmails = DB::table('users')->pluck('email')->map(fn ($e) => strtolower($e))->flip()->toArray();

        $trialDays = (int) (DB::table('app_settings')->where('setting_key', 'trial_days')->value('setting_value') ?? 7);
        $validPlans = ['demo', 'monthly', 'sixmonth'];

        $imported = 0;
        $errors = [];
        $rowNum = 1; // header was row 0

        DB::beginTransaction();
        try {
            foreach ($rows as $row) {
                $rowNum++;
                $name     = isset($cols['name']) ? trim($row[$cols['name']] ?? '') : '';
                $email    = trim($row[$cols['email']] ?? '');
                $password = trim($row[$cols['password']] ?? '');
                $plan     = isset($cols['plan']) ? strtolower(trim($row[$cols['plan']] ?? 'demo')) : 'demo';

                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $errors[] = ['row' => $rowNum, 'email' => $email, 'error' => 'Invalid email format'];
                    continue;
                }
                if (strlen($password) < 6) {
                    $errors[] = ['row' => $rowNum, 'email' => $email, 'error' => 'Password must be at least 6 characters'];
                    continue;
                }
                if (isset($existingEmails[strtolower($email)])) {
                    $errors[] = ['row' => $rowNum, 'email' => $email, 'error' => 'Email already exists'];
                    continue;
                }
                if (!in_array($plan, $validPlans, true)) $plan = 'demo';

                $user = User::create([
                    'email'         => $email,
                    'password_hash' => password_hash($password, PASSWORD_DEFAULT),
                    'name'          => $name ?: null,
                    'role'          => 'user',
                    'email_verified' => 0,
                ]);

                $expires = match ($plan) {
                    'monthly'  => now()->addDays(30),
                    'sixmonth' => now()->addDays(180),
                    default    => now()->addDays($trialDays),
                };
                Subscription::create([
                    'user_id'    => $user->id,
                    'plan'       => $plan,
                    'status'     => 'active',
                    'started_at' => now(),
                    'expires_at' => $expires,
                ]);

                $existingEmails[strtolower($email)] = true;
                $imported++;
            }
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'error' => 'Import failed: ' . $e->getMessage()], 500);
        }

        return response()->json([
            'success'  => true,
            'imported' => $imported,
            'errors'   => $errors,
            'message'  => "Imported {$imported} users" . (count($errors) ? ', ' . count($errors) . ' errors' : ''),
        ]);
    }

    public function importFlashcards(Request $request): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;
        [$header, $rows] = $this->readCsv($request);

        $cols = array_flip($header);
        $required = ['card_key', 'domain_id', 'front', 'back'];
        foreach ($required as $r) {
            if (!isset($cols[$r])) {
                return response()->json(['success' => false, 'error' => "CSV must include column '{$r}'"], 400);
            }
        }

        $existingKeys = DB::table('flashcards')->pluck('card_key')->flip()->toArray();
        $validDomains = DB::table('domains')->pluck('id')->flip()->toArray();

        $imported = 0;
        $errors = [];
        $rowNum = 1;

        DB::beginTransaction();
        try {
            foreach ($rows as $row) {
                $rowNum++;
                $key       = trim($row[$cols['card_key']] ?? '');
                $domainId  = trim($row[$cols['domain_id']] ?? '');
                $front     = trim($row[$cols['front']] ?? '');
                $back      = trim($row[$cols['back']] ?? '');
                $imageUrl  = isset($cols['image_url']) ? trim($row[$cols['image_url']] ?? '') : null;

                if ($key === '' || $front === '' || $back === '') {
                    $errors[] = ['row' => $rowNum, 'key' => $key, 'error' => 'card_key/front/back required'];
                    continue;
                }
                if (!isset($validDomains[$domainId])) {
                    $errors[] = ['row' => $rowNum, 'key' => $key, 'error' => "Unknown domain_id: {$domainId}"];
                    continue;
                }
                if (isset($existingKeys[$key])) {
                    $errors[] = ['row' => $rowNum, 'key' => $key, 'error' => 'Duplicate card_key'];
                    continue;
                }

                Flashcard::create([
                    'card_key'  => $key,
                    'domain_id' => $domainId,
                    'front'     => $front,
                    'back'      => $back,
                    'image_url' => $imageUrl ?: null,
                ]);
                $existingKeys[$key] = true;
                $imported++;
            }
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'error' => 'Import failed: ' . $e->getMessage()], 500);
        }

        return response()->json([
            'success'  => true,
            'imported' => $imported,
            'errors'   => $errors,
            'message'  => "Imported {$imported} flashcards" . (count($errors) ? ', ' . count($errors) . ' errors' : ''),
        ]);
    }

    public function importQuizzes(Request $request): JsonResponse
    {
        if ($err = $this->requireSuperadmin($request)) return $err;
        [$header, $rows] = $this->readCsv($request);

        $cols = array_flip($header);
        $required = ['quiz_key', 'domain_id', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_index'];
        foreach ($required as $r) {
            if (!isset($cols[$r])) {
                return response()->json(['success' => false, 'error' => "CSV must include column '{$r}'"], 400);
            }
        }

        $existingKeys = DB::table('quizzes')->pluck('quiz_key')->flip()->toArray();
        $validDomains = DB::table('domains')->pluck('id')->flip()->toArray();

        $imported = 0;
        $errors = [];
        $rowNum = 1;

        DB::beginTransaction();
        try {
            foreach ($rows as $row) {
                $rowNum++;
                $key      = trim($row[$cols['quiz_key']] ?? '');
                $domainId = trim($row[$cols['domain_id']] ?? '');
                $question = trim($row[$cols['question']] ?? '');
                $a = trim($row[$cols['option_a']] ?? '');
                $b = trim($row[$cols['option_b']] ?? '');
                $c = trim($row[$cols['option_c']] ?? '');
                $d = trim($row[$cols['option_d']] ?? '');
                $ci = (int) trim($row[$cols['correct_index']] ?? '0');
                $explanation = isset($cols['explanation']) ? trim($row[$cols['explanation']] ?? '') : null;

                if ($key === '' || $question === '') {
                    $errors[] = ['row' => $rowNum, 'key' => $key, 'error' => 'quiz_key/question required'];
                    continue;
                }
                if (!isset($validDomains[$domainId])) {
                    $errors[] = ['row' => $rowNum, 'key' => $key, 'error' => "Unknown domain_id: {$domainId}"];
                    continue;
                }
                if ($ci < 0 || $ci > 3) {
                    $errors[] = ['row' => $rowNum, 'key' => $key, 'error' => 'correct_index must be 0–3'];
                    continue;
                }
                if (isset($existingKeys[$key])) {
                    $errors[] = ['row' => $rowNum, 'key' => $key, 'error' => 'Duplicate quiz_key'];
                    continue;
                }

                Quiz::create([
                    'quiz_key'      => $key,
                    'domain_id'     => $domainId,
                    'question'      => $question,
                    'option_a'      => $a,
                    'option_b'      => $b,
                    'option_c'      => $c,
                    'option_d'      => $d,
                    'correct_index' => $ci,
                    'explanation'   => $explanation ?: null,
                ]);
                $existingKeys[$key] = true;
                $imported++;
            }
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'error' => 'Import failed: ' . $e->getMessage()], 500);
        }

        return response()->json([
            'success'  => true,
            'imported' => $imported,
            'errors'   => $errors,
            'message'  => "Imported {$imported} quizzes" . (count($errors) ? ', ' . count($errors) . ' errors' : ''),
        ]);
    }
}
