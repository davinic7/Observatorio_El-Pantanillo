<?php
// Archivo: api/get_novedades_all.php — PÚBLICO. Todas las novedades activas para la página "Noticias".
require_once __DIR__ . '/jwt_helper.php';
require_once __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: " . frontend_origin());
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

load_env(__DIR__ . '/.env');

try {
    $pdo = get_db_connection();
    $stmt = $pdo->query(
        "SELECT id, titulo, contenido, imagen_url, fecha_publicacion
           FROM novedades
          WHERE activo = true
          ORDER BY fecha_publicacion DESC, id DESC"
    );
    $rows = $stmt->fetchAll();

    echo json_encode(["status" => "ok", "total" => count($rows), "data" => $rows]);
} catch (Throwable $e) {
    respond_error(500, 'Error interno del servidor.', $e);
}
