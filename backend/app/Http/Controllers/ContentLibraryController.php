<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use Smalot\PdfParser\Parser as PdfParser;
use PhpOffice\PhpWord\IOFactory as WordIOFactory;

class ContentLibraryController extends Controller
{
    private const CHUNK_MAX_CHARS = 1200;

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/admin/content
    // List all sources with filters.
    // ─────────────────────────────────────────────────────────────────────
    public function index(Request $req)
    {
        $q = DB::table('content_sources');
        if ($req->filled('type'))     $q->where('type', $req->type);
        if ($req->filled('status'))   $q->where('status', $req->status);
        if ($req->filled('domain_id')) {
            $q->whereRaw('JSON_CONTAINS(domain_ids, ?)', ['"' . $req->domain_id . '"']);
        }
        if ($req->filled('search')) {
            $s = '%' . $req->search . '%';
            $q->where(function ($w) use ($s) {
                $w->where('title', 'like', $s)
                  ->orWhere('description', 'like', $s)
                  ->orWhere('original_filename', 'like', $s);
            });
        }

        $items = $q->orderByDesc('created_at')->limit(200)->get()->map(function ($s) {
            return [
                'id' => $s->id,
                'type' => $s->type,
                'title' => $s->title,
                'description' => $s->description,
                'original_filename' => $s->original_filename,
                'file_size' => (int) $s->file_size,
                'mime_type' => $s->mime_type,
                'file_url' => $s->file_path ? url('storage/' . $s->file_path) : null,
                'thumbnail_url' => $s->thumbnail_path ? url('storage/' . $s->thumbnail_path) : null,
                'domain_ids' => json_decode($s->domain_ids ?? '[]', true),
                'cert_keys' => json_decode($s->cert_keys ?? '[]', true),
                'tags' => json_decode($s->tags ?? '[]', true),
                'chunk_count' => (int) $s->chunk_count,
                'page_count' => $s->page_count ? (int) $s->page_count : null,
                'status' => $s->status,
                'author' => $s->author,
                'publisher' => $s->publisher,
                'publish_year' => $s->publish_year,
                'created_at' => $s->created_at,
            ];
        });

        return response()->json([
            'success' => true,
            'items' => $items,
            'count' => $items->count(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/admin/content/upload
    // Multipart upload with automatic type detection + text extraction.
    // ─────────────────────────────────────────────────────────────────────
    public function upload(Request $req)
    {
        $validated = $req->validate([
            'file'        => 'required|file|max:102400', // 100 MB cap
            'title'       => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'domain_ids'  => 'nullable|string', // comma-separated
            'cert_keys'   => 'nullable|string',
            'tags'        => 'nullable|string',
            'author'      => 'nullable|string|max:255',
            'publisher'   => 'nullable|string|max:255',
            'publish_year'=> 'nullable|integer|min:1900|max:2100',
        ]);

        $file = $req->file('file');
        $origName = $file->getClientOriginalName();
        $ext = strtolower($file->getClientOriginalExtension());
        $mime = $file->getMimeType();
        $size = $file->getSize();

        $type = $this->detectType($ext, $mime);
        $stored = Str::uuid() . '.' . $ext;
        // Use the `public` disk explicitly (Laravel 11: default disk is `local` → storage/app/private)
        $file->storeAs('content', $stored, 'public');
        $relativePath = 'content/' . $stored;
        $absPath = storage_path('app/public/' . $relativePath);

        $title = $validated['title'] ?? pathinfo($origName, PATHINFO_FILENAME);

        $sourceId = DB::table('content_sources')->insertGetId([
            'type' => $type,
            'title' => $title,
            'description' => $validated['description'] ?? null,
            'original_filename' => $origName,
            'stored_filename' => $stored,
            'mime_type' => $mime,
            'file_size' => $size,
            'file_path' => $relativePath,
            'domain_ids' => json_encode($this->csv($validated['domain_ids'] ?? '')),
            'cert_keys' => json_encode($this->csv($validated['cert_keys'] ?? '')),
            'tags' => json_encode($this->csv($validated['tags'] ?? '')),
            'author' => $validated['author'] ?? null,
            'publisher' => $validated['publisher'] ?? null,
            'publish_year' => $validated['publish_year'] ?? null,
            'status' => 'processing',
            'uploaded_by' => optional($req->user())->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Attempt extraction + chunking synchronously (OK for small files)
        try {
            $this->extractAndChunk($sourceId, $absPath, $type);
            DB::table('content_sources')->where('id', $sourceId)->update([
                'status' => 'ready',
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            DB::table('content_sources')->where('id', $sourceId)->update([
                'status' => 'failed',
                'processing_error' => $e->getMessage(),
                'updated_at' => now(),
            ]);
        }

        $src = DB::table('content_sources')->where('id', $sourceId)->first();
        return response()->json([
            'success' => true,
            'source' => [
                'id' => $src->id,
                'type' => $src->type,
                'title' => $src->title,
                'status' => $src->status,
                'chunk_count' => (int) $src->chunk_count,
                'page_count' => $src->page_count,
                'file_url' => url('storage/' . $src->file_path),
            ],
        ], 201);
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/admin/content/{id}
    // ─────────────────────────────────────────────────────────────────────
    public function show($id)
    {
        $src = DB::table('content_sources')->find($id);
        if (!$src) return response()->json(['error' => 'Not found'], 404);
        $chunks = DB::table('content_chunks')
            ->where('source_id', $id)
            ->orderBy('chunk_index')
            ->limit(50)
            ->get();
        return response()->json([
            'success' => true,
            'source' => array_merge((array) $src, [
                'file_url' => url('storage/' . $src->file_path),
                'domain_ids' => json_decode($src->domain_ids ?? '[]', true),
                'cert_keys' => json_decode($src->cert_keys ?? '[]', true),
                'tags' => json_decode($src->tags ?? '[]', true),
            ]),
            'chunks' => $chunks,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/admin/content/search?q=…&limit=…
    // Full-text search across chunks. Returns highest-relevance matches.
    // ─────────────────────────────────────────────────────────────────────
    public function search(Request $req)
    {
        $q = trim($req->query('q', ''));
        $limit = min(50, (int) $req->query('limit', 10));
        if ($q === '') {
            return response()->json(['success' => true, 'matches' => []]);
        }

        // MySQL full-text search; fallback to LIKE if fulltext unavailable
        $hasFulltext = true;
        try {
            $rows = DB::select(
                "SELECT c.id, c.source_id, c.chunk_index, c.page_number, c.heading, c.text,
                        s.title AS source_title, s.type AS source_type, s.original_filename,
                        MATCH(c.text) AGAINST (? IN NATURAL LANGUAGE MODE) AS score
                 FROM content_chunks c
                 JOIN content_sources s ON s.id = c.source_id
                 WHERE MATCH(c.text) AGAINST (? IN NATURAL LANGUAGE MODE)
                 ORDER BY score DESC
                 LIMIT {$limit}",
                [$q, $q]
            );
        } catch (\Throwable $e) {
            $hasFulltext = false;
            $like = '%' . $q . '%';
            $rows = DB::select(
                "SELECT c.id, c.source_id, c.chunk_index, c.page_number, c.heading, c.text,
                        s.title AS source_title, s.type AS source_type, s.original_filename,
                        0 AS score
                 FROM content_chunks c
                 JOIN content_sources s ON s.id = c.source_id
                 WHERE c.text LIKE ?
                 LIMIT {$limit}",
                [$like]
            );
        }

        $matches = array_map(function ($r) use ($q) {
            // build snippet around the match
            $text = (string) $r->text;
            $pos = stripos($text, $q);
            $snippet = $pos === false
                ? mb_substr($text, 0, 220)
                : mb_substr($text, max(0, $pos - 80), 260);
            return [
                'chunk_id' => $r->id,
                'source_id' => $r->source_id,
                'source_title' => $r->source_title,
                'source_type' => $r->source_type,
                'filename' => $r->original_filename,
                'page_number' => $r->page_number,
                'heading' => $r->heading,
                'snippet' => $snippet,
                'score' => round((float) $r->score, 2),
            ];
        }, $rows);

        return response()->json([
            'success' => true,
            'matches' => $matches,
            'query' => $q,
            'engine' => $hasFulltext ? 'fulltext' : 'like',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // PATCH /api/admin/content/{id}
    // Update metadata (title, description, domain_ids, cert_keys, tags,
    // author, publisher, publish_year) on an already-uploaded source.
    // File content stays untouched — only metadata is mutated.
    // ─────────────────────────────────────────────────────────────────────
    public function update(Request $req, $id)
    {
        $src = DB::table('content_sources')->find($id);
        if (!$src) return response()->json(['error' => 'Not found'], 404);

        $validated = $req->validate([
            'title'       => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'domain_ids'  => 'nullable|string',
            'cert_keys'   => 'nullable|string',
            'tags'        => 'nullable|string',
            'author'      => 'nullable|string|max:255',
            'publisher'   => 'nullable|string|max:255',
            'publish_year'=> 'nullable|integer|min:1900|max:2100',
        ]);

        $updates = ['updated_at' => now()];
        if (array_key_exists('title', $validated) && $validated['title'] !== null)       $updates['title'] = $validated['title'];
        if (array_key_exists('description', $validated))                                  $updates['description'] = $validated['description'];
        if (array_key_exists('domain_ids', $validated))                                   $updates['domain_ids'] = json_encode($this->csv($validated['domain_ids'] ?? ''));
        if (array_key_exists('cert_keys', $validated))                                    $updates['cert_keys']  = json_encode($this->csv($validated['cert_keys'] ?? ''));
        if (array_key_exists('tags', $validated))                                         $updates['tags']       = json_encode($this->csv($validated['tags'] ?? ''));
        if (array_key_exists('author', $validated))                                       $updates['author'] = $validated['author'];
        if (array_key_exists('publisher', $validated))                                    $updates['publisher'] = $validated['publisher'];
        if (array_key_exists('publish_year', $validated))                                 $updates['publish_year'] = $validated['publish_year'];

        DB::table('content_sources')->where('id', $id)->update($updates);

        $fresh = DB::table('content_sources')->find($id);
        return response()->json([
            'success' => true,
            'source' => array_merge((array) $fresh, [
                'domain_ids' => json_decode($fresh->domain_ids ?? '[]', true),
                'cert_keys'  => json_decode($fresh->cert_keys ?? '[]', true),
                'tags'       => json_decode($fresh->tags ?? '[]', true),
            ]),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/admin/content/bulk
    // Bulk action across multiple content sources at once.
    // body: { ids:[1,2,3], action:'assign_domains'|'add_tags'|'delete',
    //         domain_ids?:'domain1,domain3', tags?:'foo,bar', mode?:'replace'|'merge' }
    // ─────────────────────────────────────────────────────────────────────
    public function bulk(Request $req)
    {
        $validated = $req->validate([
            'ids'        => 'required|array|min:1|max:200',
            'ids.*'      => 'integer',
            'action'     => 'required|in:assign_domains,add_tags,delete',
            'domain_ids' => 'nullable|string',
            'tags'       => 'nullable|string',
            'mode'       => 'nullable|in:replace,merge',
        ]);

        $ids = $validated['ids'];
        $action = $validated['action'];
        $mode = $validated['mode'] ?? 'merge';
        $affected = 0;

        if ($action === 'delete') {
            $sources = DB::table('content_sources')->whereIn('id', $ids)->get();
            foreach ($sources as $s) {
                $abs = storage_path('app/public/' . $s->file_path);
                if (file_exists($abs)) @unlink($abs);
            }
            DB::table('content_chunks')->whereIn('source_id', $ids)->delete();
            $affected = DB::table('content_sources')->whereIn('id', $ids)->delete();
            return response()->json(['success' => true, 'action' => $action, 'affected' => $affected]);
        }

        if ($action === 'assign_domains') {
            $newDomains = $this->csv($validated['domain_ids'] ?? '');
            $rows = DB::table('content_sources')->whereIn('id', $ids)->get(['id', 'domain_ids']);
            foreach ($rows as $r) {
                $existing = json_decode($r->domain_ids ?? '[]', true) ?: [];
                $merged = $mode === 'replace'
                    ? $newDomains
                    : array_values(array_unique(array_merge($existing, $newDomains)));
                DB::table('content_sources')->where('id', $r->id)->update([
                    'domain_ids' => json_encode($merged),
                    'updated_at' => now(),
                ]);
                $affected++;
            }
            return response()->json(['success' => true, 'action' => $action, 'affected' => $affected]);
        }

        if ($action === 'add_tags') {
            $newTags = $this->csv($validated['tags'] ?? '');
            $rows = DB::table('content_sources')->whereIn('id', $ids)->get(['id', 'tags']);
            foreach ($rows as $r) {
                $existing = json_decode($r->tags ?? '[]', true) ?: [];
                $merged = $mode === 'replace'
                    ? $newTags
                    : array_values(array_unique(array_merge($existing, $newTags)));
                DB::table('content_sources')->where('id', $r->id)->update([
                    'tags' => json_encode($merged),
                    'updated_at' => now(),
                ]);
                $affected++;
            }
            return response()->json(['success' => true, 'action' => $action, 'affected' => $affected]);
        }

        return response()->json(['success' => false, 'error' => 'Unknown action'], 400);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/admin/content/{id}/reprocess
    // Re-run extraction on a source that previously failed.
    // ─────────────────────────────────────────────────────────────────────
    public function reprocess($id)
    {
        $src = DB::table('content_sources')->find($id);
        if (!$src) return response()->json(['error' => 'Not found'], 404);

        $absPath = storage_path('app/public/' . $src->file_path);
        if (!file_exists($absPath)) {
            return response()->json(['success' => false, 'error' => 'File missing on disk'], 404);
        }

        // Clear old chunks + error
        DB::table('content_chunks')->where('source_id', $id)->delete();
        DB::table('content_sources')->where('id', $id)->update([
            'status' => 'processing',
            'processing_error' => null,
            'chunk_count' => 0,
            'extracted_text' => null,
        ]);

        try {
            $this->extractAndChunk($id, $absPath, $src->type);
            DB::table('content_sources')->where('id', $id)->update([
                'status' => 'ready',
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            DB::table('content_sources')->where('id', $id)->update([
                'status' => 'failed',
                'processing_error' => $e->getMessage(),
                'updated_at' => now(),
            ]);
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }

        $updated = DB::table('content_sources')->find($id);
        return response()->json([
            'success' => true,
            'source' => [
                'id' => $updated->id,
                'status' => $updated->status,
                'chunk_count' => (int) $updated->chunk_count,
                'page_count' => $updated->page_count,
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // DELETE /api/admin/content/{id}
    // ─────────────────────────────────────────────────────────────────────
    public function destroy($id)
    {
        $src = DB::table('content_sources')->find($id);
        if (!$src) return response()->json(['error' => 'Not found'], 404);
        if ($src->file_path && Storage::disk('public')->exists($src->file_path)) {
            Storage::disk('public')->delete($src->file_path);
        }
        DB::table('content_sources')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────
    private function detectType(string $ext, ?string $mime): string
    {
        $ext = strtolower($ext);
        if ($ext === 'pdf') return 'pdf';
        if (in_array($ext, ['doc', 'docx'])) return 'docx';
        if (in_array($ext, ['txt', 'md', 'csv'])) return 'txt';
        if (in_array($ext, ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'])) return 'image';
        if (in_array($ext, ['mp3', 'wav', 'm4a', 'ogg', 'flac'])) return 'audio';
        if (in_array($ext, ['mp4', 'mov', 'webm', 'avi', 'mkv'])) return 'video';
        if ($mime && strpos($mime, 'image/') === 0) return 'image';
        if ($mime && strpos($mime, 'audio/') === 0) return 'audio';
        if ($mime && strpos($mime, 'video/') === 0) return 'video';
        return 'other';
    }

    private function csv(?string $s): array
    {
        if (!$s) return [];
        return array_values(array_filter(array_map('trim', explode(',', $s))));
    }

    private function extractAndChunk(int $sourceId, string $absPath, string $type): void
    {
        $text = '';
        $pageCount = null;

        if ($type === 'pdf') {
            $parser = new PdfParser();
            $pdf = $parser->parseFile($absPath);
            $pages = $pdf->getPages();
            $pageCount = count($pages);
            foreach ($pages as $i => $page) {
                $pageText = $page->getText();
                $this->insertChunksForText($sourceId, $pageText, $i + 1);
            }
            $text = $pdf->getText();

            // OCR FALLBACK: scanned PDFs have no embedded text
            if (trim($text) === '') {
                $ocrText = $this->ocrScannedPdf($absPath);
                if ($ocrText !== '') {
                    $this->insertChunksForText($sourceId, $ocrText, null);
                    $text = $ocrText;
                } else {
                    // Signal to caller so admin sees a useful message
                    throw new \RuntimeException(
                        'PDF is scanned/image-only and OCR is not available. ' .
                        'Install Tesseract (https://github.com/UB-Mannheim/tesseract/wiki) ' .
                        'or provide a valid Gemini API key, or export the PDF with Adobe Acrobat using ' .
                        '"Save as Other → Searchable PDF" before uploading.'
                    );
                }
            }
        } elseif ($type === 'docx') {
            $phpWord = WordIOFactory::load($absPath);
            foreach ($phpWord->getSections() as $section) {
                foreach ($section->getElements() as $element) {
                    if (method_exists($element, 'getText')) {
                        $t = $element->getText();
                        if (is_string($t) && trim($t) !== '') $text .= $t . "\n";
                    } elseif (method_exists($element, 'getElements')) {
                        foreach ($element->getElements() as $inner) {
                            if (method_exists($inner, 'getText')) {
                                $t = $inner->getText();
                                if (is_string($t) && trim($t) !== '') $text .= $t . ' ';
                            }
                        }
                        $text .= "\n";
                    }
                }
            }
            $this->insertChunksForText($sourceId, $text, null);
        } elseif ($type === 'txt') {
            $text = @file_get_contents($absPath) ?: '';
            $this->insertChunksForText($sourceId, $text, null);
        } elseif ($type === 'audio' || $type === 'video') {
            // Whisper transcription via Groq (free)
            $text = $this->transcribeWithWhisper($absPath);
            if ($text !== '') {
                $this->insertChunksForText($sourceId, $text, null);
            }
        }
        // image — nothing to extract; file still searchable by title/tags

        $chunkCount = DB::table('content_chunks')->where('source_id', $sourceId)->count();
        DB::table('content_sources')->where('id', $sourceId)->update([
            'extracted_text' => mb_substr($text, 0, 600000), // cap 600KB
            'chunk_count' => $chunkCount,
            'page_count' => $pageCount,
            'updated_at' => now(),
        ]);
    }

    private function insertChunksForText(int $sourceId, string $text, ?int $pageNumber): void
    {
        $text = preg_replace('/\s+/u', ' ', $text);
        $text = trim($text);
        if ($text === '') return;

        // Split on paragraph boundaries if present, else by sentence clusters
        $parts = preg_split('/\n{2,}|(?<=[.!?])\s{2,}/u', $text);
        $buf = '';
        $index = (int) DB::table('content_chunks')->where('source_id', $sourceId)->max('chunk_index') ?? 0;

        foreach ((array) $parts as $p) {
            if (mb_strlen($buf) + mb_strlen($p) > self::CHUNK_MAX_CHARS && $buf !== '') {
                $this->insertChunk($sourceId, $index++, $pageNumber, $buf);
                $buf = '';
            }
            $buf .= ($buf === '' ? '' : ' ') . $p;
        }
        if (trim($buf) !== '') {
            $this->insertChunk($sourceId, $index, $pageNumber, $buf);
        }
    }

    private function insertChunk(int $sourceId, int $index, ?int $pageNumber, string $text): void
    {
        $text = trim(mb_substr($text, 0, 4000));
        if (mb_strlen($text) < 20) return; // skip very short chunks

        // Heading = first line if Title Case / all-caps short
        $heading = null;
        $firstNewline = strpos($text, '. ');
        if ($firstNewline !== false && $firstNewline < 120) {
            $cand = trim(mb_substr($text, 0, $firstNewline));
            if (mb_strlen($cand) < 100 && preg_match('/^[A-Z0-9][\w\s&\-\(\)\/:]+$/', $cand)) {
                $heading = $cand;
            }
        }

        $keywords = $this->extractKeywords($text);

        DB::table('content_chunks')->insert([
            'source_id' => $sourceId,
            'chunk_index' => $index,
            'page_number' => $pageNumber,
            'heading' => $heading,
            'text' => $text,
            'text_length' => mb_strlen($text),
            'keywords' => json_encode($keywords),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * OCR a scanned/image-only PDF.
     * Strategy: try local Tesseract CLI first, fall back to Gemini Vision, else return ''.
     */
    private function ocrScannedPdf(string $absPath): string
    {
        // Strategy 1: Tesseract CLI if available on PATH
        $tess = $this->findTesseract();
        if ($tess) {
            return $this->ocrWithTesseract($tess, $absPath);
        }

        // Strategy 2: Gemini Vision — extracts text from PDF pages directly
        $geminiKey = (string) config('services.gemini.key', '');
        if ($geminiKey !== '') {
            return $this->ocrWithGeminiVision($geminiKey, $absPath);
        }

        return '';
    }

    private function findTesseract(): ?string
    {
        $candidates = [
            'tesseract',
            'C:\\Program Files\\Tesseract-OCR\\tesseract.exe',
            'C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe',
            '/usr/bin/tesseract',
            '/usr/local/bin/tesseract',
        ];
        foreach ($candidates as $c) {
            $check = @shell_exec('"' . $c . '" --version 2>&1');
            if ($check && stripos($check, 'tesseract') !== false) return $c;
        }
        return null;
    }

    private function ocrWithTesseract(string $tess, string $pdfPath): string
    {
        // Tesseract reads images, not PDFs. We need pdftoppm (poppler) to split PDF into pages.
        $pdftoppm = $this->findPdftoppm();
        if (!$pdftoppm) {
            \Log::info('OCR skipped: pdftoppm not found. Install Poppler for Windows or use Gemini.');
            return '';
        }
        $tmpDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'ocr_' . uniqid();
        @mkdir($tmpDir, 0777, true);
        $prefix = $tmpDir . DIRECTORY_SEPARATOR . 'page';
        @shell_exec('"' . $pdftoppm . '" -png -r 200 "' . $pdfPath . '" "' . $prefix . '" 2>&1');
        $images = glob($prefix . '-*.png');
        $text = '';
        foreach ($images as $img) {
            $out = @shell_exec('"' . $tess . '" "' . $img . '" - -l eng 2>&1');
            if (is_string($out)) $text .= $out . "\n";
            @unlink($img);
        }
        @rmdir($tmpDir);
        return trim($text);
    }

    private function findPdftoppm(): ?string
    {
        foreach (['pdftoppm', 'C:\\Program Files\\poppler\\Library\\bin\\pdftoppm.exe', '/usr/bin/pdftoppm'] as $c) {
            $check = @shell_exec('"' . $c . '" -v 2>&1');
            if ($check && stripos($check, 'pdftoppm') !== false) return $c;
        }
        return null;
    }

    /**
     * Use Gemini Vision to extract text from a PDF (multimodal model reads pages natively).
     */
    private function ocrWithGeminiVision(string $apiKey, string $pdfPath): string
    {
        try {
            $model = (string) config('services.gemini.model', 'gemini-2.0-flash');
            $bytes = @file_get_contents($pdfPath);
            if ($bytes === false || strlen($bytes) > 20 * 1024 * 1024) return ''; // 20 MB cap
            $base64 = base64_encode($bytes);

            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
            $res = Http::timeout(180)->post($url, [
                'contents' => [[
                    'role' => 'user',
                    'parts' => [
                        [ 'text' => 'Extract ALL text from this PDF in reading order. Return only the raw text — no preamble, no summary, preserve paragraph breaks. If the PDF is multi-page, keep pages separated by blank lines.' ],
                        [ 'inline_data' => [
                            'mime_type' => 'application/pdf',
                            'data' => $base64,
                        ]],
                    ],
                ]],
                'generationConfig' => [
                    'temperature' => 0.0,
                    'maxOutputTokens' => 8192,
                ],
            ]);
            if (!$res->successful()) {
                \Log::warning('Gemini Vision OCR failed', ['status' => $res->status(), 'body' => mb_substr($res->body(), 0, 300)]);
                return '';
            }
            $text = $res->json('candidates.0.content.parts.0.text');
            return is_string($text) ? trim($text) : '';
        } catch (\Throwable $e) {
            \Log::warning('Gemini Vision OCR exception: ' . $e->getMessage());
            return '';
        }
    }

    /**
     * Transcribe audio/video using Groq's Whisper API (free tier).
     * File size limit ~25 MB. Supports mp3, mp4, mpeg, mpga, m4a, wav, webm.
     */
    private function transcribeWithWhisper(string $absPath): string
    {
        $groqKey   = (string) config('services.groq.key', '');
        $whisperModel = (string) config('services.groq.whisper_model', 'whisper-large-v3-turbo');
        if ($groqKey === '' || !file_exists($absPath)) return '';
        $size = filesize($absPath);
        if ($size > 25 * 1024 * 1024) return ''; // Groq limit

        try {
            $res = Http::timeout(300)
                ->withToken($groqKey)
                ->attach('file', fopen($absPath, 'r'), basename($absPath))
                ->post('https://api.groq.com/openai/v1/audio/transcriptions', [
                    'model' => $whisperModel,
                    'response_format' => 'json',
                ]);
            if (!$res->successful()) {
                \Log::warning('Groq Whisper failed', ['status' => $res->status(), 'body' => mb_substr($res->body(), 0, 300)]);
                return '';
            }
            $text = $res->json('text');
            return is_string($text) ? trim($text) : '';
        } catch (\Throwable $e) {
            \Log::warning('Groq Whisper exception: ' . $e->getMessage());
            return '';
        }
    }

    private function extractKeywords(string $text): array
    {
        // Simple keyword extraction: lowercase, strip stopwords, count, top 8
        $stop = ['the','and','for','are','but','not','you','any','can','all','with','from','this','that','these','those','also','must','may','one','two','per','was','were','have','has','been','each','such','into','its','their','them','they','which','where','when','what','who','how','why'];
        $words = preg_split('/[^a-z0-9]+/i', strtolower($text));
        $count = [];
        foreach ($words as $w) {
            if (mb_strlen($w) < 4) continue;
            if (in_array($w, $stop, true)) continue;
            $count[$w] = ($count[$w] ?? 0) + 1;
        }
        arsort($count);
        return array_slice(array_keys($count), 0, 8);
    }
}
