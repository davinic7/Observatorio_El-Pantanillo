<?php
declare(strict_types=1);

/**
 * Observatorio Parque Industrial - API Front Controller
 * Basic router and CORS bootstrap.
 */

require_once __DIR__ . '/config/Database.php';

use App\Config\Database;

// ---------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------
$allowedOrigin = getenv('CORS_ALLOWED_ORIGIN') ?: 'http://localhost:5173';

header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---------------------------------------------------------------------
// Request parsing
// ---------------------------------------------------------------------
$requestUri    = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$basePath      = '/api';
$path          = preg_replace('#^' . preg_quote($basePath, '#') . '#', '', $requestUri) ?: '/';
$path          = '/' . trim($path, '/');
$method        = $_SERVER['REQUEST_METHOD'];

// ---------------------------------------------------------------------
// Routes (placeholders — controllers to be wired up later)
// ---------------------------------------------------------------------
try {
    switch (true) {
        case $path === '/' && $method === 'GET':
            echo json_encode([
                'service' => 'Observatorio Parque Industrial API',
                'status'  => 'ok',
                'version' => '0.1.0',
            ]);
            break;

        case $path === '/health' && $method === 'GET':
            $pdo = Database::getConnection();
            $pdo->query('SELECT 1');
            echo json_encode([
                'status'   => 'healthy',
                'database' => 'connected',
            ]);
            break;

        default:
            http_response_code(404);
            echo json_encode([
                'error'  => 'Not Found',
                'path'   => $path,
                'method' => $method,
            ]);
            break;
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error'   => 'Internal Server Error',
        'message' => $e->getMessage(),
    ]);
}
