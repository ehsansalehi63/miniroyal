<?php
/**
 * MiniRoyal Tipax/Postex Iran Relay
 * ----------------------------------
 * این فایل روی هاست ایرانی (میزبان‌فا) قرار می‌گیرد و درخواست‌های
 * سایت (هاستینگر آلمان) را با IP ایران به سرویس‌های تیپاکس/پستکس می‌رساند.
 *
 * نصب:
 *   1. یک زیردامنه روی میزبان‌فا بسازید، مثلاً: relay.yourdomain.ir
 *      و public_html آن این فایل را به نام relay.php بگذارید.
 *   2. مقدار RELAY_SECRET را با مقدار تولیدی خود جایگزین کنید.
 *   3. روی هاستینگر، متغیرهای محیطی زیر را تنظیم کنید:
 *        TIPAX_RELAY_URL=https://relay.yourdomain.ir/relay.php
 *        TIPAX_RELAY_SECRET=<همان مقدار RELAY_SECRET>
 *
 * امنیت:
 *   - هر درخواست باید هدر X-Relay-Secret را با مقدار صحیح داشته باشد.
 *   - فقط مسیرهای تعریف‌شده (allowlist) پذیرفته می‌شوند.
 *   - هیچ داده‌ای ذخیره نمی‌شود؛ فقط رله می‌شود.
 */

const RELAY_SECRET = 'RELAY-e966ba10c154878e5bdcbd178cd2511e10b81e70786326dd';

// سرویس‌های مجاز: پیشوند ارسالی => آپستریم واقعی
const UPSTREAMS = [
  'tipax'  => 'https://omapi.tipax.ir',
  'postex' => 'https://api.postex.ir',
];

// ---------- امکانات پایه ----------

function deny(int $code, string $message): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['isSuccess' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function relayRequest(string $upstreamBase, string $path): void {
    $method = $_SERVER['REQUEST_METHOD'];
    if (!in_array($method, ['GET', 'POST'], true)) {
        deny(405, 'روش درخواست پشتیبانی نمی‌شود.');
    }

    $url = $upstreamBase . $path;

    $body = null;
    if ($method === 'POST') {
        $body = file_get_contents('php://input');
        if ($body === '' || $body === false) $body = null;
    }

    // هدرهای اصلی را بازخوانی می‌کنیم (Authorization و Content-Type حیاتی‌اند)
    // نکته: UA مرورگر واقعی می‌گذاریم؛ فایروال میزبندا UA های غیرمعروف را
    // با 406 رد می‌کند.
    $headers = [
        'Accept: application/json',
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    ];

    // Authorization از هدر استاندارد
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
    if ($auth !== null) {
        $headers[] = 'Authorization: ' . $auth;
    }
    // X-Api-Key پستکس
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? null;
    if ($apiKey !== null) {
        $headers[] = 'X-Api-Key: ' . $apiKey;
    }
    // Content-Type: روی برخی هاست‌ها به‌صورت CONTENT_TYPE (بدون پیشوند HTTP_) در دسترس است
    // برای POST همیشه یک CT مشخص لازم است؛ در غیر این صورت تیپاکس 415 می‌دهد
    if ($method === 'POST') {
        $contentType = $_SERVER['HTTP_CONTENT_TYPE'] ?? $_SERVER['CONTENT_TYPE'] ?? 'application/json';
        $headers[] = 'Content-Type: ' . $contentType;
    }

    $ch = curl_init($url);
    $curlOptions = [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => false,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_FOLLOWLOCATION => false,
    ];
    if ($body !== null) {
        $curlOptions[CURLOPT_POSTFIELDS] = $body;
    }
    curl_setopt_array($ch, $curlOptions);

    $responseBody = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($responseBody === false) {
        deny(502, 'خطای اتصال به سرویس بالادستی: ' . $error);
    }

    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo $responseBody;
    exit;
}

// ---------- اجرا ----------

// ۱) بررسی رمز مخفی
$secret = $_SERVER['HTTP_X_RELAY_SECRET'] ?? '';
if (!hash_equals(RELAY_SECRET, (string)$secret)) {
    deny(401, 'رمز رله نامعتبر است.');
}

// ۲) تشخیص سرویس و مسیر
// فرمت: /relay.php?service=tipax&path=/api/OM/v3/Account/token
// یا از هدر: X-Relay-Path: /api/... (اگر فایروال کوئری‌استرینگ path را نپسندد)
$service = $_GET['service'] ?? '';
$path = $_GET['path'] ?? '';
$headerPath = $_SERVER['HTTP_X_RELAY_PATH'] ?? '';
if ($headerPath !== '') {
    $path = $headerPath;
}

if (!isset(UPSTREAMS[$service])) {
    deny(400, 'سرویس نامعتبر است. مقادیر مجاز: tipax, postex');
}
if ($path === '' || $path[0] !== '/') {
    deny(400, 'مسیر باید با / شروع شود.');
}
// مسیرهای مجاز فقط از API تیپاکس/پستکس؛ هیچ مسیر دلخواهی پذیرفته نمی‌شود.
if (!preg_match('#^/api/#', $path)) {
    deny(400, 'فقط مسیرهای API مجازند.');
}

relayRequest(UPSTREAMS[$service], $path);
