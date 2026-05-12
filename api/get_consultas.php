<?php
// Archivo: api/get_consultas.php — Listado de consultas para gestores (JWT).
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
require_jwt(env_value('JWT_SECRET', ''));

try {
    $pdo = get_db_connection();
    $stmt = $pdo->query(
        "SELECT id, nombre, email, empresa, mensaje, leida, fecha_envio
           FROM consultas_contacto
          ORDER BY fecha_envio DESC, id DESC"
    );
    $consultas = $stmt->fetchAll();

    echo json_encode([
        "status" => "ok",
        "total"  => count($consultas),
        "data"   => $consultas,
    ]);
} catch (Throwable $e) {
    respond_error(500, 'Error interno del servidor.', $e);
}
