<?php
// Archivo: api/get_novedades_admin.php — Listado completo para gestores (JWT).
require_once __DIR__ . '/jwt_helper.php';
require_once __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: " . frontend_origin());
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

load_env(__DIR__ . '/.env');
require_jwt($_ENV['JWT_SECRET'] ?? '');

try {
    $pdo = get_db_connection();
    $stmt = $pdo->query(
        "SELECT id, titulo, contenido, imagen_url, activo, fecha_publicacion
           FROM novedades
          ORDER BY fecha_publicacion DESC, id DESC"
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
