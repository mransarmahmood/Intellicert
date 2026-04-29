<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Local XAMPP runs the site under /visuallearn/. Strip that prefix from
// REQUEST_URI so Laravel's router sees /api/... instead of
// /visuallearn/api/... (production at Hostinger mounts backend/public
// directly, so this branch never runs there).
if (isset($_SERVER['REQUEST_URI']) && str_starts_with($_SERVER['REQUEST_URI'], '/visuallearn/')) {
    $_SERVER['REQUEST_URI'] = substr($_SERVER['REQUEST_URI'], strlen('/visuallearn'));
}

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../backend-app/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../backend-app/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/../backend-app/bootstrap/app.php')
    ->handleRequest(Request::capture());
