<?php
/**
 * ROBOT HOUSE — JARVIS AI Backend
 * Gemini 1.5 Flash streaming endpoint
 */
declare(strict_types=1);
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }

$GEMINI_KEY = 'AIzaSyAb8RN6LBij0FfcijbRmXykmSsTZvA6bR8eEIbI0k3nfpVTpPn';

$body = json_decode(file_get_contents('php://input'), true);
$history  = $body['history']  ?? [];
$message  = trim($body['message'] ?? '');
$lang     = $body['lang']     ?? 'ar';
$stream   = $body['stream']   ?? false;

if (!$message) { http_response_code(400); echo json_encode(['error'=>'empty message']); exit; }

/* ── System prompt ── */
$system = $lang === 'ar'
? "أنت JARVIS، المساعد الذكي الرسمي لشركة ROBOT HOUSE FZ LLC.
شركة ROBOT HOUSE هي شركة إماراتية رائدة في مجال المدن الذكية المتكاملة، تأسست برؤية مستقبلية لبناء مدن ذكية تجمع بين التكنولوجيا المتقدمة والاستدامة والرفاهية.

منتجات وخدمات الشركة:
- المجمع السكني الذكي: 480 شقة فاخرة، كهرباء مجانية، إنترنت 5 سنوات
- المركبات المبتكرة: مركبات ذكية متعددة الاستخدامات
- المنزل الذكي المتنقل: مضاد للرصاص، مقاوم للماء والحريق، تحكم بالذكاء الاصطناعي
- المدينة الذكية الأولى في العالم: منظومة متكاملة للسكن والعمل والترفيه
- المرافق الذكية: مدرسة، مول، مستشفى، فندق ذكي
- القطار الذكي: نقل داخلي متطور
- شاحنة الشاورما الذكية، المزرعة الذكية، نقل الأسماك، توابل فاخرة
- الجسر المعلق، المطعم الذكي البحري

التقنيات المستخدمة: ذكاء اصطناعي، هولوجرام، طاقة شمسية، إسمنت مولّد للكهرباء، فلترة مياه متقدمة، تحكم صوتي كامل.

فرص الاستثمار: عوائد مرتفعة، نموذج تشغيلي متكامل، سوق الإمارات والخليج والعالم.

قواعد الرد:
- أجب دائماً بثقة واحترافية باسم ROBOT HOUSE
- إذا سألك عن التنقل في الموقع قل: [NAVIGATE:اسم_القسم]
- إذا طُلب تغيير الثيم قل: [THEME:gold|dark|white]
- إذا طُلب تشغيل صوت قل: [SOUND:on|off]
- الردود مختصرة وواضحة ما لم يُطلب التفصيل
- تحدث بالعربية الفصحى السهلة"
: "You are JARVIS, the official AI assistant of ROBOT HOUSE FZ LLC.
ROBOT HOUSE is a UAE-based company pioneering integrated smart cities combining advanced technology, sustainability, and luxury living.

Products & Services:
- Smart Residential Complex: 480 luxury apartments, free electricity, 5-year internet
- Innovative Vehicles: multi-purpose smart vehicles
- Mobile Smart Home: bulletproof, waterproof, fireproof, AI-controlled
- World's First Smart City: integrated ecosystem for living, work, and entertainment
- Smart Facilities: school, mall, hospital, hotel
- Smart Train: advanced internal transport
- Smart Shawarma Truck, Smart Farm, Fish Transport, Premium Spices
- Suspended Bridge, Smart Seafood Restaurant

Technologies: AI, hologram, solar energy, electricity-generating cement, advanced water filtration, full voice control.

Investment: high returns, integrated operational model, UAE/Gulf/global market.

Rules:
- Always respond confidently and professionally as ROBOT HOUSE
- For navigation requests say: [NAVIGATE:section_name]
- For theme changes say: [THEME:gold|dark|white]
- For sound say: [SOUND:on|off]
- Keep answers concise unless detail is requested
- Speak professional English";

/* ── Build Gemini request ── */
$contents = [];
foreach ($history as $h) {
    $contents[] = ['role' => $h['role'], 'parts' => [['text' => $h['text']]]];
}
$contents[] = ['role' => 'user', 'parts' => [['text' => $message]]];

$payload = [
    'system_instruction' => ['parts' => [['text' => $system]]],
    'contents' => $contents,
    'generationConfig' => [
        'temperature'     => 0.7,
        'maxOutputTokens' => 1024,
        'topP'            => 0.9,
    ],
    'safetySettings' => [
        ['category'=>'HARM_CATEGORY_HARASSMENT','threshold'=>'BLOCK_NONE'],
        ['category'=>'HARM_CATEGORY_HATE_SPEECH','threshold'=>'BLOCK_NONE'],
        ['category'=>'HARM_CATEGORY_SEXUALLY_EXPLICIT','threshold'=>'BLOCK_NONE'],
        ['category'=>'HARM_CATEGORY_DANGEROUS_CONTENT','threshold'=>'BLOCK_NONE'],
    ]
];

$model = 'gemini-1.5-flash';

if ($stream) {
    /* ── Streaming response ── */
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:streamGenerateContent?alt=sse&key={$GEMINI_KEY}";
    header('Content-Type: text/event-stream');
    header('Cache-Control: no-cache');
    header('X-Accel-Buffering: no');

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_WRITEFUNCTION  => function($ch, $data) {
            echo $data;
            ob_flush(); flush();
            return strlen($data);
        },
        CURLOPT_TIMEOUT        => 60,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    curl_exec($ch);
    curl_close($ch);
} else {
    /* ── Non-streaming response ── */
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$GEMINI_KEY}";
    header('Content-Type: application/json');

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $resp = curl_exec($ch);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($err) { echo json_encode(['error' => $err]); exit; }
    echo $resp;
}
