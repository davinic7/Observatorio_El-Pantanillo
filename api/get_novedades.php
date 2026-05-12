<?php
// Archivo: api/get_novedades.php — PÚBLICO, sin JWT. Últimas 3 activas.
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
          ORDER BY fecha_publicacion DESC, id DESC
          LIMIT 3"
    );
    $novedades = $stmt->fetchAll();

    echo json_encode([
        "status" => "ok",
        "total"  => count($novedades),
        "data"   => $novedades,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
}
