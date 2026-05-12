<?php
// Archivo: api/get_stats.php — estadísticas globales para el Dashboard.
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
    $totalEmpresas = (int) $pdo->query("SELECT COUNT(*) FROM empresas")->fetchColumn();
    $totalLotes    = (int) $pdo->query("SELECT COUNT(*) FROM lotes")->fetchColumn();

    $stmt = $pdo->query("SELECT estado, COUNT(*) AS cantidad FROM lotes GROUP BY estado");
    $lotesPorEstado = [];
    foreach ($stmt->fetchAll() as $row) {
        $lotesPorEstado[strtolower(trim((string) $row['estado']))] = (int) $row['cantidad'];
    }

    $novedadesActivas = 0;
    $consultasSinLeer = 0;
    try {
        $novedadesActivas = (int) $pdo
            ->query("SELECT COUNT(*) FROM novedades WHERE activo = true")
            ->fetchColumn();
    } catch (PDOException $_) {
        $novedadesActivas = 0;
    }
    try {
        $consultasSinLeer = (int) $pdo
            ->query("SELECT COUNT(*) FROM consultas_contacto WHERE leida = false")
            ->fetchColumn();
    } catch (PDOException $_) {
        $consultasSinLeer = 0;
    }

    echo json_encode([
        "status" => "ok",
        "data"   => [
            "total_empresas"     => $totalEmpresas,
            "total_lotes"        => $totalLotes,
            "lotes_por_estado"   => $lotesPorEstado,
            "novedades_activas"  => $novedadesActivas,
            "consultas_sin_leer" => $consultasSinLeer,
        ],
    ]);
} catch (Throwable $e) {
    respond_error(500, 'Error interno del servidor.', $e);
}
