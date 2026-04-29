<?php

namespace App\Http\Controllers;

use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class AiController extends Controller
{
    private function localFallback(string $task, string $context = ''): string
    {
        $trim = trim($context);
        if ($task === 'quiz-json') {
            return json_encode([
                'questions' => [
                    [
                        'question' => 'Which action best reflects proactive hazard control?',
                        'options' => ['Wait for incidents', 'Identify hazards and implement controls', 'Skip documentation', 'Only train yearly'],
                        'correct_index' => 1,
                        'explanation' => 'Proactive risk control is central to CSP-style safety practice.',
                    ],
                ],
            ]);
        }

        return "AI fallback mode is active.\n\nUse this structured response to continue learning:\n- Core idea: define the topic in one sentence.\n- Practical use: explain one real workplace scenario.\n- Recall check: list 3 key terms and test yourself.\n\nContext snapshot:\n{$trim}";
    }

    private function aiText(string $systemPrompt, string $userPrompt): array
    {
        $provider = config('services.ai.provider', 'auto');
        $ollamaBase = rtrim((string) config('services.ollama.base_url', 'http://127.0.0.1:11434'), '/');
        $ollamaModel = (string) config('services.ollama.model', 'llama3.1:8b');
        $groqKey = (string) config('services.groq.key', '');
        $groqModel = (string) config('services.groq.model', 'llama-3.3-70b-versatile');

        $tryOllama = function () use ($ollamaBase, $ollamaModel, $systemPrompt, $userPrompt) {
            $res = Http::timeout(90)->post($ollamaBase . '/api/chat', [
                'model' => $ollamaModel,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                'stream' => false,
            ]);
            if (!$res->successful()) {
                return null;
            }
            return $res->json('message.content');
        };

        $geminiKey = (string) config('services.gemini.key', '');
        $geminiModel = (string) config('services.gemini.model', 'gemini-2.0-flash');

        $tryGemini = function () use ($geminiKey, $geminiModel, $systemPrompt, $userPrompt) {
            if (empty($geminiKey)) return null;
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$geminiModel}:generateContent?key={$geminiKey}";
            $res = Http::timeout(60)->post($url, [
                'contents' => [[
                    'role' => 'user',
                    'parts' => [[ 'text' => $systemPrompt . "\n\n" . $userPrompt ]],
                ]],
                'generationConfig' => [
                    'temperature' => 0.5,
                    'maxOutputTokens' => 4096,
                ],
            ]);
            if (!$res->successful()) return null;
            // Gemini returns { candidates: [{ content: { parts: [{ text: ... }] } }] }
            $text = $res->json('candidates.0.content.parts.0.text');
            return is_string($text) && trim($text) !== '' ? $text : null;
        };

        $tryGroq = function () use ($groqKey, $groqModel, $systemPrompt, $userPrompt) {
            if (empty($groqKey)) {
                return null;
            }
            $res = Http::timeout(60)->withToken($groqKey)
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => $groqModel,
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $userPrompt],
                    ],
                    'temperature' => 0.5,
                    'max_tokens' => 4096,
                ]);
            if (!$res->successful()) {
                return null;
            }
            return $res->json('choices.0.message.content');
        };

        try {
            if ($provider === 'ollama') {
                $content = $tryOllama();
                return ['content' => $content ?: $this->localFallback('text', $userPrompt), 'provider' => $content ? 'ollama' : 'local'];
            }
            if ($provider === 'groq') {
                $content = $tryGroq();
                return ['content' => $content ?: $this->localFallback('text', $userPrompt), 'provider' => $content ? 'groq' : 'local'];
            }
            if ($provider === 'gemini') {
                $content = $tryGemini();
                return ['content' => $content ?: $this->localFallback('text', $userPrompt), 'provider' => $content ? 'gemini' : 'local'];
            }
            if ($provider === 'local') {
                return ['content' => $this->localFallback('text', $userPrompt), 'provider' => 'local'];
            }

            // auto (free-first resilience chain): ollama -> groq -> gemini -> local
            $content = $tryOllama();
            if ($content) return ['content' => $content, 'provider' => 'ollama'];
            $content = $tryGroq();
            if ($content) return ['content' => $content, 'provider' => 'groq'];
            $content = $tryGemini();
            if ($content) return ['content' => $content, 'provider' => 'gemini'];
        } catch (\Throwable $e) {
            // fall through to local
        }

        return ['content' => $this->localFallback('text', $userPrompt), 'provider' => 'local'];
    }

    private function aiJson(string $systemPrompt, string $userPrompt): array
    {
        $out = $this->aiText($systemPrompt . "\nReturn JSON only.", $userPrompt);
        $parsed = json_decode((string) $out['content'], true);
        if (!is_array($parsed)) {
            $fallback = json_decode($this->localFallback('quiz-json'), true) ?: [];
            return ['json' => $fallback, 'provider' => 'local'];
        }
        return ['json' => $parsed, 'provider' => $out['provider']];
    }

    /**
     * POST /api/ai/explain
     * body: { topic_id, mode: 'simple'|'discuss'|'three-layer'|'illustration'|'quiz'|'tutor' }
     */
    public function explain(Request $request): JsonResponse
    {
        $data = $request->validate([
            'topic_id' => 'required|integer|exists:topics,id',
            'mode'     => 'required|in:simple,discuss,three-layer,illustration,quiz,tutor',
        ]);

        $topic = Topic::with('concepts:id,topic_id,title,description')->find($data['topic_id']);
        if (!$topic) return response()->json(['success' => false, 'error' => 'Topic not found'], 404);

        $ctx  = "Topic: {$topic->name}\n";
        if ($topic->subtitle) $ctx .= "Subtitle: {$topic->subtitle}\n";
        if ($topic->overview) $ctx .= "Overview: " . strip_tags((string) $topic->overview) . "\n";
        if ($topic->concepts && $topic->concepts->count() > 0) {
            $ctx .= "Key concepts:\n";
            foreach ($topic->concepts->take(8) as $c) {
                $ctx .= "- {$c->title}: " . substr(strip_tags($c->description ?? ''), 0, 200) . "\n";
            }
        }

        $prompts = [
            'simple'       => "Explain this CSP topic in plain English a high-school student would understand. Use 3-4 short paragraphs. Avoid jargon. Use everyday analogies.",
            'discuss'      => "You are a CSP exam tutor. Have a friendly Socratic discussion of this topic. Open with one big-picture statement, then ask 3 thought-provoking questions and answer each briefly. End with: 'Want to go deeper into any of these?'",
            'three-layer'  => "Explain this CSP topic in three layers:\n1) **Layer 1 — Beginner (1 paragraph):** the core idea in plain English.\n2) **Layer 2 — Intermediate (2 paragraphs):** how it works in practice with one concrete example.\n3) **Layer 3 — Expert (3 paragraphs):** the technical depth a CSP candidate needs, including standards/regulations and edge cases.\nUse markdown headings.",
            'illustration' => "Suggest a single visual illustration that would teach this concept best. Describe what should appear in the diagram (subjects, layout, colors, labels). Then write an alt-text caption a screen reader could read aloud.",
            'quiz'         => "Generate exactly 3 multiple-choice CSP exam questions about this topic. For each: Question, Option A/B/C/D, Correct: <letter>, Why it's correct: <explanation>. Use markdown. Progressively harder.",
            'tutor'        => "Act as an interactive CSP tutor. Give: 1) one concise explanation, 2) one diagnostic question, 3) one common mistake to avoid, 4) one next-step practice task.",
        ];
        $ai = $this->aiText(
            'You are an expert Certified Safety Professional (CSP) exam tutor. Be encouraging, accurate, and concise.',
            "Reference material:\n\n{$ctx}\n\nTask: " . $prompts[$data['mode']]
        );

        return response()->json([
            'success' => true,
            'mode'    => $data['mode'],
            'topic'   => $topic->name,
            'provider' => $ai['provider'],
            'content' => (string) ($ai['content'] ?? ''),
        ]);
    }

    /**
     * POST /api/ai/feynman
     * body: { topic_id?, topic_name?, explanation }
     *
     * Uses Feynman technique: student tries to teach the concept in simple terms.
     * AI returns: grade 0-100, summary, gaps[], strengths[], suggestion.
     */

    /**
     * POST /api/ai/generate-quiz
     * body: { domain_id, difficulty (easy|medium|hard), count (default 5) }
     * Returns AI-generated MCQs in the same shape as the seeded quizzes endpoint.
     */
    public function generateQuiz(Request $request): JsonResponse
    {
        $data = $request->validate([
            'domain_id'  => 'required|string|exists:domains,id',
            'difficulty' => 'nullable|in:easy,medium,hard',
            'count'      => 'nullable|integer|min:1|max:10',
        ]);
        $count = $data['count'] ?? 5;
        $difficulty = $data['difficulty'] ?? 'medium';

        $domain = \Illuminate\Support\Facades\DB::table('domains')->where('id', $data['domain_id'])->first();
        if (!$domain) {
            return response()->json(['success' => false, 'error' => 'Domain not found'], 404);
        }
        $topicNames = \Illuminate\Support\Facades\DB::table('topics')
            ->where('domain_id', $data['domain_id'])->pluck('name')->take(8)->implode(', ');

        $system = "You are an expert Certified Safety Professional (CSP) exam author. Generate exactly {$count} fresh "
            . "multiple-choice questions on the requested CSP exam domain. Return strict JSON of this exact shape (no prose outside JSON):\n"
            . "{\"questions\":[{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correct_index\":0,\"explanation\":\"...\"},...]}\n"
            . "Rules: each question has exactly 4 options. Difficulty: {$difficulty}. Reference real OSHA/ANSI/NFPA standards where appropriate. Distractors must be plausible.";
        $userPrompt = "Domain: {$domain->name}\nTopic areas: {$topicNames}\nGenerate {$count} {$difficulty} questions now.";
        $ai = $this->aiJson($system, $userPrompt);
        $parsed = $ai['json'] ?? null;
        if (!is_array($parsed) || !isset($parsed['questions']) || !is_array($parsed['questions'])) {
            $parsed = json_decode($this->localFallback('quiz-json'), true);
        }

        $out = [];
        foreach ($parsed['questions'] as $i => $q) {
            $opts = $q['options'] ?? [];
            if (count($opts) < 4) continue;
            $out[] = [
                'id'            => -1 * (1000 + $i), // negative IDs so they don't collide with real DB rows
                'quiz_key'      => 'ai-' . uniqid('', true) . '-' . $i,
                'domain_id'     => $data['domain_id'],
                'question'      => (string) ($q['question'] ?? ''),
                'option_a'      => (string) $opts[0],
                'option_b'      => (string) $opts[1],
                'option_c'      => (string) $opts[2],
                'option_d'      => (string) $opts[3],
                'correct_index' => (int) ($q['correct_index'] ?? 0),
                'explanation'   => (string) ($q['explanation'] ?? ''),
                'kind'          => 'ai',
                'difficulty'    => $difficulty,
            ];
        }
        return response()->json(['success' => true, 'provider' => $ai['provider'] ?? 'local', 'quizzes' => $out, 'total' => count($out)]);
    }

    public function feynman(Request $request): JsonResponse
    {
        $data = $request->validate([
            'topic_id'    => 'nullable|integer|exists:topics,id',
            'topic_name'  => 'nullable|string|max:255',
            'explanation' => 'required|string|min:20|max:5000',
        ]);

        // Build a topic context from the DB if topic_id was provided
        $topicContext = '';
        $topicTitle = $data['topic_name'] ?? '';
        if (!empty($data['topic_id'])) {
            $topic = Topic::with('concepts:id,topic_id,title,description')->find($data['topic_id']);
            if ($topic) {
                $topicTitle = $topic->name;
                $topicContext = "Topic: {$topic->name}\n";
                if ($topic->subtitle) $topicContext .= "Subtitle: {$topic->subtitle}\n";
                if ($topic->overview) $topicContext .= "Overview: {$topic->overview}\n";
                if ($topic->concepts && $topic->concepts->count() > 0) {
                    $topicContext .= "Key concepts:\n";
                    foreach ($topic->concepts as $c) {
                        $topicContext .= "- {$c->title}: " . substr($c->description ?? '', 0, 200) . "\n";
                    }
                }
            }
        }

        if ($topicTitle === '') {
            return response()->json(['success' => false, 'error' => 'topic_id or topic_name required'], 400);
        }

        $systemPrompt = <<<TXT
You are an expert CSP (Certified Safety Professional) exam tutor grading a student using the Feynman technique.
The student has tried to explain a topic in their own words. Your job is to evaluate how well they understand it.

You MUST respond with a single JSON object exactly matching this schema (no markdown, no prose outside JSON):
{
  "grade": <integer 0-100>,
  "summary": "<one-sentence verdict on understanding level>",
  "strengths": ["<concrete thing they got right>", ...],
  "gaps":      ["<concrete thing they missed or got wrong>", ...],
  "suggestion": "<one specific next study action>"
}

Grading rubric:
- 90-100: Comprehensive, accurate, uses correct terminology, would pass an exam question.
- 75-89:  Mostly correct, minor gaps or imprecise wording.
- 60-74:  Right idea but missing key elements.
- 40-59:  Partial understanding with significant errors.
- 0-39:   Fundamentally incorrect or off-topic.

Be encouraging but honest. Strengths and gaps must be SPECIFIC — quote or paraphrase what they wrote.
TXT;

        $userPrompt = "Reference material the student should know:\n\n{$topicContext}\n\n"
                    . "Student's explanation of \"{$topicTitle}\":\n\n\"\"\"\n{$data['explanation']}\n\"\"\"";

        $ai = $this->aiJson($systemPrompt, $userPrompt);
        $parsed = $ai['json'] ?? null;
        if (!is_array($parsed)) {
            $parsed = [
                'grade' => 65,
                'summary' => 'Partial understanding; key details need reinforcement.',
                'strengths' => ['You attempted a full explanation and used topic language.'],
                'gaps' => ['Missing one or more critical mechanisms or standards context.'],
                'suggestion' => 'Revisit the 3-layer explanation and then teach it again in 5 bullet points.',
            ];
        }

        return response()->json([
            'success' => true,
            'provider' => $ai['provider'] ?? 'local',
            'topic'   => $topicTitle,
            'grade'      => (int) ($parsed['grade'] ?? 0),
            'summary'    => (string) ($parsed['summary'] ?? ''),
            'strengths'  => array_values((array) ($parsed['strengths'] ?? [])),
            'gaps'       => array_values((array) ($parsed['gaps'] ?? [])),
            'suggestion' => (string) ($parsed['suggestion'] ?? ''),
        ]);
    }

    /**
     * POST /api/ai/generate-discussion
     * Body: {
     *   topic_key: string,          // legacy id e.g. "ptd" or numeric id as string
     *   title: string,
     *   subtitle?: string,
     *   context?: string,            // optional overview/concepts to seed the dialogue
     *   style?: 'podcast'|'debate'|'socratic',
     *   refresh?: bool               // if true, regenerate even if cached
     * }
     *
     * Returns structured dialogue between 2 speakers, cached per (topic_key, style).
     */
    public function generateDiscussion(Request $request): JsonResponse
    {
        $data = $request->validate([
            'topic_key' => 'required|string|max:100',
            'title'     => 'required|string|max:255',
            'subtitle'  => 'nullable|string|max:500',
            'context'   => 'nullable|string|max:6000',
            'style'     => 'nullable|string|in:podcast,debate,socratic',
            'refresh'   => 'nullable|boolean',
        ]);
        $style = $data['style'] ?? 'podcast';
        $refresh = $data['refresh'] ?? false;

        // Return cached unless refresh=true
        if (!$refresh) {
            $cached = DB::table('topic_discussions')
                ->where('topic_key', $data['topic_key'])
                ->where('style', $style)
                ->orderByDesc('id')->first();
            if ($cached) {
                return response()->json([
                    'success' => true,
                    'cached'  => true,
                    'dialogue' => json_decode($cached->dialogue, true),
                    'turn_count' => (int) $cached->turn_count,
                    'approx_seconds' => (int) $cached->approx_seconds,
                    'provider' => $cached->provider,
                    'style' => $style,
                ]);
            }
        }

        $systemPrompt = 'You are a scriptwriter producing educational audio content for CSP exam prep. Output ONLY valid JSON — no fences, no preamble.';

        $stylePrompts = [
            'podcast'  => 'Write a friendly 2-host podcast discussion (Host + Expert). The Host asks curious questions, the Expert gives concise accurate answers with real examples. Natural conversational tone.',
            'debate'   => 'Write a structured debate between two safety professionals with different perspectives (one pragmatic, one strict-compliance). They should disagree thoughtfully but both hold defensible positions.',
            'socratic' => 'Write a Socratic-style dialogue between a Teacher and Student. Teacher guides with questions; Student reasons out loud and gradually builds understanding.',
        ];

        $styleHint = $stylePrompts[$style];

        $ctx = '';
        if (!empty($data['subtitle'])) $ctx .= "Subtitle: {$data['subtitle']}\n";
        if (!empty($data['context']))  $ctx .= "Reference material:\n{$data['context']}\n";

        $userPrompt = <<<USR
Topic: {$data['title']}
{$ctx}
Style: {$styleHint}

Produce a JSON object:
{
  "title": "Short episode title (max 70 chars)",
  "summary": "1-sentence teaser",
  "turns": [
    { "speaker": "host"|"expert"|"teacher"|"student"|"pragmatist"|"strict",
      "name": "short speaker name to display (e.g. 'Sarah' or 'Dr. Chen')",
      "line": "what this speaker says, 1-3 sentences, ~15-50 words"
    }
    // 14 to 22 turns total
  ]
}

Rules:
- Cover the topic comprehensively: definition → why it matters → common misconceptions → real-world example → exam-tip → memorable closing.
- Alternate speakers roughly evenly.
- First turn from speaker "host" (or "teacher" if socratic), last turn wraps up with a takeaway.
- Include OSHA / NFPA / ANSI citations when relevant in the expert's lines.
- Use natural phrasings: "Right, and that's where..." or "Wait — let me make sure I understand".
- No markdown in lines. Plain text only.
USR;

        $ai = $this->aiText($systemPrompt, $userPrompt);
        $raw = trim((string) $ai['content']);
        $raw = preg_replace('/^```(?:json)?\s*/m', '', $raw);
        $raw = preg_replace('/\s*```\s*$/m', '', $raw);
        $first = strpos($raw, '{'); $last = strrpos($raw, '}');
        if ($first !== false && $last !== false && $last > $first) $raw = substr($raw, $first, $last - $first + 1);
        $parsed = json_decode($raw, true);
        if (!is_array($parsed)) {
            // repair attempt
            $attempt = $raw;
            for ($i = 0; $i < 6 && !is_array($parsed); $i++) {
                $attempt .= substr_count($attempt, '[') > substr_count($attempt, ']') ? ']' : '}';
                $parsed = json_decode($attempt, true);
            }
        }
        if (!is_array($parsed) || empty($parsed['turns']) || !is_array($parsed['turns'])) {
            return response()->json([
                'success' => false,
                'error' => 'AI did not return valid dialogue JSON',
                'provider' => $ai['provider'],
                'raw_preview' => mb_substr($raw, 0, 400),
            ], 500);
        }

        $turns = array_values(array_filter($parsed['turns'], fn ($t) => is_array($t) && !empty($t['line'])));
        $wordCount = array_sum(array_map(fn ($t) => str_word_count((string) $t['line']), $turns));
        // ~150 words/min → seconds
        $approxSeconds = (int) round(($wordCount / 150) * 60);

        // Cache it
        DB::table('topic_discussions')->insert([
            'topic_key' => $data['topic_key'],
            'style' => $style,
            'dialogue' => json_encode([
                'title' => $parsed['title'] ?? $data['title'],
                'summary' => $parsed['summary'] ?? '',
                'turns' => $turns,
            ]),
            'turn_count' => count($turns),
            'approx_seconds' => $approxSeconds,
            'provider' => $ai['provider'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'cached' => false,
            'dialogue' => [
                'title' => $parsed['title'] ?? $data['title'],
                'summary' => $parsed['summary'] ?? '',
                'turns' => $turns,
            ],
            'turn_count' => count($turns),
            'approx_seconds' => $approxSeconds,
            'provider' => $ai['provider'],
            'style' => $style,
        ]);
    }

    /**
     * POST /api/ai/tts
     * Body: { text: string, voice?: string, rate?: string, pitch?: string }
     *
     * Proxies text-to-speech through Microsoft Edge's public TTS endpoint
     * (no API key required, studio-grade neural voices). Returns an MP3
     * audio stream. Cached via a URL the browser can <audio src=""> directly.
     *
     * Voices (a curated list of the best):
     *   en-US-AriaNeural, en-US-JennyNeural, en-US-GuyNeural, en-US-DavisNeural,
     *   en-US-EmmaNeural, en-US-BrianNeural, en-GB-SoniaNeural, en-GB-RyanNeural,
     *   en-AU-NatashaNeural, en-AU-WilliamNeural
     */
    public function tts(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $data = $request->validate([
            'text'  => 'required|string|max:5000',
            'voice' => 'nullable|string|max:80',
            'rate'  => 'nullable|string|max:10',
            'pitch' => 'nullable|string|max:10',
        ]);
        $text = $data['text'];
        $voice = $data['voice'] ?? 'en-US-JennyNeural';
        $rate = $data['rate'] ?? '+0%';
        $pitch = $data['pitch'] ?? '+0Hz';

        // Build SSML
        $safeText = htmlspecialchars($text, ENT_XML1 | ENT_QUOTES, 'UTF-8');
        $ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>"
              . "<voice name='{$voice}'><prosody rate='{$rate}' pitch='{$pitch}'>{$safeText}</prosody></voice></speak>";

        // Microsoft Edge TTS token endpoint (public, free, used by Edge Read Aloud)
        $trustedClientToken = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
        $url = "https://speech.platform.bing.com/consumerapi/convert/v1/tts/{$trustedClientToken}";

        try {
            $res = Http::timeout(60)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edge/111.0.0.0',
                    'Origin'     => 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
                    'X-Microsoft-OutputFormat' => 'audio-24khz-48kbitrate-mono-mp3',
                    'Content-Type' => 'application/ssml+xml',
                ])
                ->withBody($ssml, 'application/ssml+xml')
                ->post($url);

            if (!$res->successful()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Edge TTS failed: ' . $res->status(),
                    'hint' => 'This provider may be rate-limited. Use browser voices as fallback.'
                ], 502);
            }
            return response($res->body(), 200)
                ->header('Content-Type', 'audio/mpeg')
                ->header('Cache-Control', 'public, max-age=86400')
                ->header('Access-Control-Allow-Origin', '*');
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => 'TTS exception: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/ai/tts/voices
     * Returns the curated list of best Edge TTS voices.
     */
    public function ttsVoices(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'voices' => [
                // Female US
                ['id' => 'en-US-JennyNeural',    'name' => 'Jenny',    'gender' => 'F', 'locale' => 'en-US', 'style' => 'friendly, warm'],
                ['id' => 'en-US-AriaNeural',     'name' => 'Aria',     'gender' => 'F', 'locale' => 'en-US', 'style' => 'professional, clear'],
                ['id' => 'en-US-EmmaNeural',     'name' => 'Emma',     'gender' => 'F', 'locale' => 'en-US', 'style' => 'cheerful'],
                ['id' => 'en-US-AvaNeural',      'name' => 'Ava',      'gender' => 'F', 'locale' => 'en-US', 'style' => 'natural'],
                ['id' => 'en-US-MichelleNeural', 'name' => 'Michelle', 'gender' => 'F', 'locale' => 'en-US', 'style' => 'conversational'],
                // Male US
                ['id' => 'en-US-GuyNeural',      'name' => 'Guy',      'gender' => 'M', 'locale' => 'en-US', 'style' => 'relaxed'],
                ['id' => 'en-US-DavisNeural',    'name' => 'Davis',    'gender' => 'M', 'locale' => 'en-US', 'style' => 'confident'],
                ['id' => 'en-US-BrianNeural',    'name' => 'Brian',    'gender' => 'M', 'locale' => 'en-US', 'style' => 'approachable'],
                ['id' => 'en-US-TonyNeural',     'name' => 'Tony',     'gender' => 'M', 'locale' => 'en-US', 'style' => 'expressive'],
                ['id' => 'en-US-AndrewNeural',   'name' => 'Andrew',   'gender' => 'M', 'locale' => 'en-US', 'style' => 'warm'],
                // UK
                ['id' => 'en-GB-SoniaNeural',    'name' => 'Sonia',    'gender' => 'F', 'locale' => 'en-GB', 'style' => 'british, crisp'],
                ['id' => 'en-GB-RyanNeural',     'name' => 'Ryan',     'gender' => 'M', 'locale' => 'en-GB', 'style' => 'british'],
                ['id' => 'en-GB-LibbyNeural',    'name' => 'Libby',    'gender' => 'F', 'locale' => 'en-GB', 'style' => 'british, youthful'],
                // AU
                ['id' => 'en-AU-NatashaNeural',  'name' => 'Natasha',  'gender' => 'F', 'locale' => 'en-AU', 'style' => 'australian'],
                ['id' => 'en-AU-WilliamNeural',  'name' => 'William',  'gender' => 'M', 'locale' => 'en-AU', 'style' => 'australian'],
                // CA + IN
                ['id' => 'en-CA-ClaraNeural',    'name' => 'Clara',    'gender' => 'F', 'locale' => 'en-CA', 'style' => 'canadian'],
                ['id' => 'en-IN-NeerjaNeural',   'name' => 'Neerja',   'gender' => 'F', 'locale' => 'en-IN', 'style' => 'indian english'],
                ['id' => 'en-IN-PrabhatNeural',  'name' => 'Prabhat',  'gender' => 'M', 'locale' => 'en-IN', 'style' => 'indian english'],
            ],
        ]);
    }

    /**
     * POST /api/ai/generate-image
     * Body: { topic_key, prompt, style?, width?, height? }
     * Uses Pollinations.ai (free, no API key) to generate a CSP-themed illustration.
     */
    public function generateImage(Request $request): JsonResponse
    {
        $data = $request->validate([
            'topic_key' => 'required|string|max:100',
            'prompt'    => 'required|string|max:500',
            'style'     => 'nullable|string|in:illustration,hero,diagram',
            'width'     => 'nullable|integer|min:256|max:1536',
            'height'    => 'nullable|integer|min:256|max:1536',
            'refresh'   => 'nullable|boolean',
        ]);

        $style = $data['style'] ?? 'illustration';
        $w = $data['width'] ?? 768;
        $h = $data['height'] ?? 512;
        $refresh = $data['refresh'] ?? false;

        if (!$refresh) {
            $cached = DB::table('topic_images')
                ->where('topic_key', $data['topic_key'])
                ->where('style', $style)
                ->orderByDesc('id')->first();
            if ($cached) {
                return response()->json([
                    'success' => true,
                    'cached' => true,
                    'image_url' => $cached->image_url,
                    'prompt' => $cached->prompt,
                ]);
            }
        }

        $styleSuffix = match ($style) {
            'hero' => ', modern editorial illustration, clean, professional, soft gradients, flat vector aesthetic',
            'diagram' => ', technical diagram, labeled, clean line art, minimal colors, educational',
            default => ', flat illustration, educational infographic style, clean vector, soft pastel palette, professional',
        };
        $fullPrompt = $data['prompt'] . $styleSuffix . ', safety, workplace';

        // Pollinations URL (free, no API key)
        $url = 'https://image.pollinations.ai/prompt/' . rawurlencode($fullPrompt)
             . "?width={$w}&height={$h}&nologo=true&enhance=true";

        DB::table('topic_images')->insert([
            'topic_key' => $data['topic_key'],
            'style' => $style,
            'prompt' => $fullPrompt,
            'image_url' => $url,
            'width' => (string) $w,
            'height' => (string) $h,
            'provider' => 'pollinations',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'cached' => false,
            'image_url' => $url,
            'prompt' => $fullPrompt,
        ]);
    }

    /**
     * POST /api/admin/topics/generate-with-ai
     * Body: {
     *   title: string,
     *   subtitle?: string,
     *   domain_id?: string,
     *   use_library?: bool  (default true — search uploaded references)
     * }
     *
     * Generates a full topic draft. When use_library=true, searches uploaded
     * PDFs/DOCX/TXT via FULLTEXT and feeds matched chunks to the AI as context.
     * When no library matches (or use_library=false), the AI generates from
     * its own knowledge.
     *
     * Returns structured data admin can accept into the authoring form:
     *   { overview, concepts[], formulas[], exam_tips[], scenarios[],
     *     mnemonics[], sources_used[] }
     */
    public function generateTopic(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'       => 'required|string|min:2|max:255',
            'subtitle'    => 'nullable|string|max:500',
            'domain_id'   => 'nullable|string|max:50',
            'use_library' => 'nullable|boolean',
        ]);

        $useLibrary = $data['use_library'] ?? true;
        $query = trim($data['title'] . ' ' . ($data['subtitle'] ?? ''));

        // ─── Step 1: pull matching chunks from content library ─────────
        $contextChunks = [];
        $sourcesUsed  = [];
        if ($useLibrary && $query !== '') {
            try {
                $rows = DB::select(
                    "SELECT c.id, c.text, c.page_number, c.heading,
                            s.title AS source_title, s.type AS source_type,
                            s.original_filename
                     FROM content_chunks c
                     JOIN content_sources s ON s.id = c.source_id
                     WHERE MATCH(c.text) AGAINST (? IN NATURAL LANGUAGE MODE)
                     ORDER BY MATCH(c.text) AGAINST (? IN NATURAL LANGUAGE MODE) DESC
                     LIMIT 8",
                    [$query, $query]
                );
                foreach ($rows as $r) {
                    $contextChunks[] = [
                        'source' => $r->source_title,
                        'page'   => $r->page_number,
                        'text'   => mb_substr($r->text, 0, 1200),
                    ];
                    $key = $r->source_title . ($r->page_number ? " (p.{$r->page_number})" : '');
                    if (!in_array($key, $sourcesUsed, true)) $sourcesUsed[] = $key;
                }
            } catch (\Throwable $e) {
                // Fulltext may not be available; continue with empty context
            }
        }

        // ─── Step 2: build AI prompt ────────────────────────────────────
        $contextBlock = '';
        if ($contextChunks) {
            $contextBlock = "You have access to verified reference material. Use ONLY facts present in these excerpts as the primary source of truth. Do not contradict them.\n\n";
            foreach ($contextChunks as $i => $c) {
                $contextBlock .= "--- REFERENCE " . ($i + 1) . " [{$c['source']}"
                              . ($c['page'] ? " p.{$c['page']}" : '')
                              . "] ---\n{$c['text']}\n\n";
            }
        } else {
            $contextBlock = "No reference excerpts were found in the library for this topic. Generate content from general CSP exam knowledge. Use OSHA standards, NIOSH guidance, and ANSI/NFPA references where applicable.\n\n";
        }

        $systemPrompt = <<<SYS
You are an expert Certified Safety Professional (CSP) exam content author. You are building structured educational content for an adaptive study platform. Return ONLY a valid JSON object — no preamble, no markdown fences, no commentary. Every field must be present; use an empty array/string when you genuinely have nothing.
SYS;

        $userPrompt = <<<USR
Topic title: {$data['title']}
Subtitle: {$data['subtitle']}
Domain: {$data['domain_id']}

{$contextBlock}

Produce a JSON object with this exact shape:
{
  "overview": "1-2 paragraph plain-English overview, 400-700 chars, no markdown",
  "concepts": [
    { "term": "Concept name", "definition": "2-3 sentence definition, cite standard if applicable" }
    // 4 to 8 concepts, ordered from fundamental to advanced
  ],
  "formulas": [
    { "name": "Formula name", "formula": "written form e.g. TRIR = (Recordable × 200000) / Hours", "description": "when and why used" }
    // 0 to 5 formulas — only include real ones that apply
  ],
  "exam_tips": [
    { "tip": "Concrete, test-focused tip that helps on exam day" }
    // 3 to 6 tips
  ],
  "scenarios": [
    { "title": "Real-world scenario title", "description": "2-3 sentence workplace example that demonstrates the concept" }
    // 1 to 3 scenarios
  ]
}

Rules:
- If reference excerpts cite a standard (OSHA, ANSI, NFPA), preserve the citation verbatim in concept definitions and tips.
- Keep concept definitions under 250 chars each.
- Do not invent regulations or statistics not found in the reference material when references are provided.
- Use professional safety vocabulary. No hedging like "generally" or "often".
USR;

        $out = $this->aiText($systemPrompt, $userPrompt);
        $raw = (string) ($out['content'] ?? '');

        // Extract JSON from the response (AI may wrap it in fences, add preamble, or cut mid-object)
        $raw = trim((string) $raw);
        // Strip markdown fences
        $raw = preg_replace('/^```(?:json)?\s*/m', '', $raw);
        $raw = preg_replace('/\s*```\s*$/m', '', $raw);
        // Extract first balanced JSON object
        $firstBrace = strpos($raw, '{');
        $lastBrace  = strrpos($raw, '}');
        if ($firstBrace !== false && $lastBrace !== false && $lastBrace > $firstBrace) {
            $raw = substr($raw, $firstBrace, $lastBrace - $firstBrace + 1);
        }
        $parsed = json_decode($raw, true);

        // Second attempt: if truncated mid-object, try to auto-repair by closing braces
        if (!is_array($parsed) && $firstBrace !== false) {
            $attempt = $raw;
            // Add missing closing braces/brackets up to 6 levels
            for ($i = 0; $i < 6 && !is_array($parsed); $i++) {
                $attempt .= substr_count($attempt, '[') > substr_count($attempt, ']') ? ']' : '}';
                $parsed = json_decode($attempt, true);
            }
        }

        if (!is_array($parsed)) {
            // Fallback: minimal structure so admin can still use the form
            $parsed = [
                'overview' => "The AI could not parse a response for \"{$data['title']}\". Try again, or author the topic manually.",
                'concepts' => [],
                'formulas' => [],
                'exam_tips' => [],
                'scenarios' => [],
            ];
            return response()->json([
                'success' => false,
                'error'   => 'AI response was not valid JSON',
                'provider'=> $out['provider'] ?? 'local',
                'raw'     => mb_substr($raw, 0, 500),
                'partial' => $parsed,
            ], 200);
        }

        // Normalize shape
        $norm = [
            'overview'   => (string) ($parsed['overview'] ?? ''),
            'concepts'   => array_values(array_filter((array) ($parsed['concepts'] ?? []), 'is_array')),
            'formulas'   => array_values(array_filter((array) ($parsed['formulas'] ?? []), 'is_array')),
            'exam_tips'  => array_values(array_filter((array) ($parsed['exam_tips'] ?? []), 'is_array')),
            'scenarios'  => array_values(array_filter((array) ($parsed['scenarios'] ?? []), 'is_array')),
        ];

        return response()->json([
            'success'       => true,
            'provider'      => $out['provider'] ?? 'local',
            'used_library'  => $useLibrary && !empty($contextChunks),
            'sources_used'  => $sourcesUsed,
            'reference_chunks' => count($contextChunks),
            'generated'     => $norm,
        ]);
    }
}
