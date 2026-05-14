<?php
// Archivo: api/get_public_lotes.php — endpoint PÚBLICO, sin JWT
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
    // Solo unimos empresas que estén APROBADAS por un gestor; las pendientes
    // o rechazadas no se muestran en el mapa público.
    // empresa_id se devuelve para que el frontend pueda diferenciar "lote libre"
    // (sin empresa asignada) del "modo inversor".
    $stmt = $pdo->query(
        "SELECT l.id, l.numero_lote, l.sector, l.superficie_m2,
                l.estado, l.geometria_terreno, l.empresa_id,
                COALESCE(e.nombre_empresa, e.razon_social) AS propietario_nombre
           FROM lotes l
           LEFT JOIN empresas e
                  ON l.empresa_id = e.id
                 AND e.estado_verificacion = 'aprobado'
          ORDER BY l.id ASC"
    );
    $lotes = $stmt->fetchAll();

    echo json_encode([
        "status" => "ok",
        "total"  => count($lotes),
        "data"   => $lotes,
    ]);
} catch (Throwable $e) {
    respond_error(500, 'Error interno del servidor.', $e);
}
