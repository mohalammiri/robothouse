<?php
// Simple, secure PHP range-stream endpoint for serving large media with proper Range/206 support.
// Place media files under a protected directory on the server (e.g. /var/www/media/) and expose them via this endpoint.
// Example usage: /api/stream.php?file=videos/Smart%20Train%20Video.mp4
// Security: this implementation only serves files inside a configured base directory and rejects suspicious paths.

declare(strict_types=1);

$BASE_DIR = __DIR__ . '/../media'; // adjust to your media root (outside webroot recommended)
if (!is_dir($BASE_DIR)) {
    http_response_code(500);
    echo "Media base directory not configured.";
    exit;
}

if (!isset($_GET['file'])) {
    http_response_code(400);
    echo "Missing file parameter.";
    exit;
}

// sanitize input - prevent path traversal
$requested = $_GET['file'];
$requested = str_replace(["\0"], '', $requested);
$requested = preg_replace('#\.\.[/\\\\]#', '', $requested);
$requested = ltrim($requested, '/\\');

$filePath = realpath($BASE_DIR . DIRECTORY_SEPARATOR . $requested);
if ($filePath === false || strpos($filePath, realpath($BASE_DIR)) !== 0 || !is_file($filePath)) {
    http_response_code(404);
    echo "File not found.";
    exit;
}

$filesize = filesize($filePath);
$mime = mime_content_type($filePath) ?: 'application/octet-stream';
$etag = sprintf('"%x-%x"', filemtime($filePath), $filesize);

// Cache & CORS headers (CDN-friendly)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, HEAD, OPTIONS');
header('Access-Control-Allow-Headers: Range, Accept-Encoding, If-Modified-Since, If-None-Match');
header('Cache-Control: public, max-age=31536000, immutable');
header('Accept-Ranges: bytes');
header('Content-Type: ' . $mime);

// Handle conditional requests
if ((isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) ||
    (isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) && strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) >= filemtime($filePath))
) {
    http_response_code(304);
    exit;
}

header("ETag: $etag");
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', filemtime($filePath)) . ' GMT');

// Range handling
$rangeHeader = isset($_SERVER['HTTP_RANGE']) ? $_SERVER['HTTP_RANGE'] : null;
if ($rangeHeader) {
    // parse "bytes=START-END"
    if (preg_match('/bytes=(\d*)-(\d*)/', $rangeHeader, $matches)) {
        $start = $matches[1] === '' ? null : intval($matches[1]);
        $end = $matches[2] === '' ? null : intval($matches[2]);

        if ($start === null && $end !== null) {
            // suffix range: last $end bytes
            $start = max(0, $filesize - $end);
            $end = $filesize - 1;
        } elseif ($start !== null && $end === null) {
            $end = $filesize - 1;
        }

        if ($start > $end || $start >= $filesize) {
            header('Content-Range: bytes */' . $filesize);
            http_response_code(416);
            exit;
        }

        $length = $end - $start + 1;
        header('Content-Range: bytes ' . $start . '-' . $end . '/' . $filesize);
        header('Content-Length: ' . $length);
        http_response_code(206);

        $fp = fopen($filePath, 'rb');
        if ($fp === false) {
            http_response_code(500);
            exit;
        }
        fseek($fp, $start);
        $bufferSize = 1024 * 1024; // 1MB chunk
        $bytesRemaining = $length;
        while (!feof($fp) && $bytesRemaining > 0) {
            $read = fread($fp, min($bufferSize, $bytesRemaining));
            if ($read === false) break;
            echo $read;
            flush();
            $bytesRemaining -= strlen($read);
        }
        fclose($fp);
        exit;
    } else {
        // malformed Range header
        http_response_code(400);
        echo "Malformed Range header.";
        exit;
    }
} else {
    // no range: full file (but still stream to avoid memory blow)
    header('Content-Length: ' . $filesize);
    http_response_code(200);
    $fp = fopen($filePath, 'rb');
    if ($fp === false) {
        http_response_code(500);
        exit;
    }
    $bufferSize = 1024 * 1024; // 1MB
    while (!feof($fp)) {
        echo fread($fp, $bufferSize);
        flush();
    }
    fclose($fp);
    exit;
}