<?php
/**
 * PHP built-in server router
 * Rewrites /visuallearn/<path> → /<path> to match production Apache paths.
 *
 * The production app is served from http://localhost/visuallearn/ under Apache,
 * so the frontend hardcodes /visuallearn/api/... URLs. The built-in server
 * serves from / so we strip the /visuallearn/ prefix here.
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$docroot = realpath(__DIR__ . '/..');

// Strip /visuallearn prefix if present
$stripped = $uri;
if (strpos($uri, '/visuallearn/') === 0) {
    $stripped = substr($uri, strlen('/visuallearn'));
    $_SERVER['REQUEST_URI'] = $stripped . (isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] !== '' ? '?' . $_SERVER['QUERY_STRING'] : '');
    $_SERVER['PHP_SELF'] = $stripped;
    $_SERVER['SCRIPT_NAME'] = $stripped;
}

$path = $docroot . $stripped;

// If a PHP file was rewritten, execute it directly
if (substr($stripped, -4) === '.php' && file_exists($path)) {
    $_SERVER['SCRIPT_FILENAME'] = $path;
    require $path;
    return true;
}

// Static file — let built-in server serve it (only works if no rewrite occurred)
if ($stripped === $uri && $uri !== '/' && file_exists($path) && !is_dir($path)) {
    return false;
}

// Rewritten static file — emit it manually with correct mime
if ($stripped !== $uri && file_exists($path) && !is_dir($path)) {
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    $mimes = [
        'html' => 'text/html', 'htm' => 'text/html',
        'css' => 'text/css', 'js' => 'application/javascript',
        'json' => 'application/json',
        'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
        'gif' => 'image/gif', 'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon', 'webp' => 'image/webp',
        'woff' => 'font/woff', 'woff2' => 'font/woff2',
        'ttf' => 'font/ttf', 'otf' => 'font/otf',
        'txt' => 'text/plain', 'map' => 'application/json',
        'webmanifest' => 'application/manifest+json', 'manifest' => 'application/manifest+json'
    ];
    header('Content-Type: ' . ($mimes[$ext] ?? 'application/octet-stream'));
    readfile($path);
    return true;
}

// SPA fallback: React apps at /backend/public/app/* should serve their own index.html
// when the request path doesn't match an actual file (client-side routing).
$spaRoots = [
    '/backend/public/app'       => '/backend/public/app/index.html',
    '/backend/public/admin'     => '/backend/public/admin/index.html',
    '/admin-react/dist'         => '/admin-react/dist/index.html',
    '/public'                   => '/public/index.html',
];
foreach ($spaRoots as $prefix => $fallback) {
    if (strpos($stripped, $prefix . '/') === 0 || $stripped === $prefix) {
        $fallbackPath = $docroot . $fallback;
        if (file_exists($fallbackPath) && !is_dir($fallbackPath)) {
            header('Content-Type: text/html');
            readfile($fallbackPath);
            return true;
        }
    }
}

// Directory → look for index.html / index.php
if (is_dir($path)) {
    foreach (['index.html', 'index.php'] as $idx) {
        $idxPath = $path . '/' . $idx;
        if (file_exists($idxPath)) {
            if (substr($idx, -4) === '.php') {
                $_SERVER['SCRIPT_FILENAME'] = $idxPath;
                require $idxPath;
                return true;
            }
            header('Content-Type: text/html');
            readfile($idxPath);
            return true;
        }
    }
}

// Nothing found — let default 404 behavior happen
return false;
