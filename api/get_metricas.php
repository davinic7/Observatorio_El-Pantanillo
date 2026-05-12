<?php
// Archivo: api/get_metricas.php
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
    $totalEmpresas = (int) $pdo->query("SELECT COUNT(*) FROM empresas")->fetchColumn();
    $totalLotes    = (int) $pdo->query("SELECT COUNT(*) FROM lotes")->fetchColumn();

    $stmt = $pdo->query("SELECT estado, COUNT(*) AS cantidad FROM lotes GROUP BY estado");
    $rows = $stmt->fetchAll();

    $lotesPorEstado = [];
    foreach ($rows as $row) {
        $key = strtolower(trim((string) $row['estado']));
        $lotesPorEstado[$key] = (int) $row['cantidad'];
    }

    echo json_encode([
        "status" => "ok",
        "data"   => [
            "total_empresas"    => $totalEmpresas,
            "total_lotes"       => $totalLotes,
            "lotes_por_estado"  => $lotesPorEstado,
        ],
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
}
