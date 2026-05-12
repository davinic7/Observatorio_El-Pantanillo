<?php
// Archivo: api/get_ddjj.php — JWT. Lista DDJJ con join a empresas. Filtro opcional ?empresa_id=N.
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

$empresaId = isset($_GET['empresa_id']) && is_numeric($_GET['empresa_id'])
    ? (int) $_GET['empresa_id']
    : null;

try {
    $pdo = get_db_connection();
    if ($empresaId !== null) {
        $stmt = $pdo->prepare(
            "SELECT d.id, d.empresa_id, d.titulo, d.descripcion, d.archivo_url,
                    d.fecha_presentacion, d.estado,
                    e.razon_social
               FROM declaraciones_juradas d
               LEFT JOIN empresas e ON d.empresa_id = e.id
              WHERE d.empresa_id = :empresa_id
              ORDER BY d.fecha_presentacion DESC, d.id DESC"
        );
        $stmt->execute([':empresa_id' => $empresaId]);
    } else {
        $stmt = $pdo->query(
            "SELECT d.id, d.empresa_id, d.titulo, d.descripcion, d.archivo_url,
                    d.fecha_presentacion, d.estado,
                    e.razon_social
               FROM declaraciones_juradas d
               LEFT JOIN empresas e ON d.empresa_id = e.id
              ORDER BY d.fecha_presentacion DESC, d.id DESC"
        );
    }
    $rows = $stmt->fetchAll();

    echo json_encode([
        "status" => "ok",
        "total"  => count($rows),
        "data"   => $rows,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
}
