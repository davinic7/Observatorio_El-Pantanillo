<?php
// Archivo: api/get_lotes.php
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
        "SELECT l.id, l.numero_lote, l.sector, l.superficie_m2, l.estado,
                l.geometria_terreno, l.empresa_id,
                e.razon_social AS propietario_nombre
           FROM lotes l
           LEFT JOIN empresas e ON l.empresa_id = e.id
          ORDER BY l.id ASC"
    );
    $lotes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($lotes === false) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "mensaje" => "No se pudieron obtener los lotes."
        ]);
        exit;
    }

    echo json_encode([
        "status" => "ok",
        "total" => count($lotes),
        "data" => $lotes
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
}
