<?php
// Archivo: api/test.php — endpoint de diagnóstico de conexión a la DB.
require_once __DIR__ . '/jwt_helper.php';
require_once __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: " . frontend_origin());
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

load_env(__DIR__ . '/.env');

try {
    $pdo = get_db_connection();
    $stmt = $pdo->query("SELECT version()");
    $version = $stmt->fetchColumn();

    echo json_encode([
        "status"           => "ok",
        "mensaje"          => "¡El caño no pierde! Conectado a la DB con éxito.",
        "version_postgres" => $version,
    ]);
} catch (Throwable $e) {
    respond_error(500, 'No se pudo conectar a la base de datos.', $e);
}
