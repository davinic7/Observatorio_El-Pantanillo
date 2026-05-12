<?php
// Archivo: api/get_empresas.php
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
        "SELECT id, cuit, razon_social, email_contacto, actividad_principal, logo_url
           FROM empresas
          ORDER BY id ASC"
    );
    $empresas = $stmt->fetchAll();

    echo json_encode([
        "status" => "ok",
        "total"  => count($empresas),
        "data"   => $empresas
    ]);
} catch (Throwable $e) {
    respond_error(500, 'Error interno del servidor.', $e);
}
