<?php
// Archivo: api/get_empresas_admin.php — JWT.
// Devuelve TODAS las empresas (pendientes, aprobadas, rechazadas) para el gestor.
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
    $estadoFiltro = isset($_GET['estado']) ? trim((string) $_GET['estado']) : '';
    $validos = ['pendiente', 'aprobado', 'rechazado'];

    $pdo = get_db_connection();

    if ($estadoFiltro !== '' && in_array($estadoFiltro, $validos, true)) {
        $stmt = $pdo->prepare(
            "SELECT id, nombre_empresa, rubro, estado_operativo, responsable,
                    contacto_1, contacto_2, email, direccion,
                    lote_id, manzana, estado_verificacion, fecha_registro
               FROM empresas
              WHERE estado_verificacion = :estado
              ORDER BY fecha_registro DESC, id DESC"
        );
        $stmt->execute([':estado' => $estadoFiltro]);
    } else {
        $stmt = $pdo->query(
            "SELECT id, nombre_empresa, rubro, estado_operativo, responsable,
                    contacto_1, contacto_2, email, direccion,
                    lote_id, manzana, estado_verificacion, fecha_registro
               FROM empresas
              ORDER BY fecha_registro DESC, id DESC"
        );
    }
    $rows = $stmt->fetchAll();

    $totalesPorEstado = ['pendiente' => 0, 'aprobado' => 0, 'rechazado' => 0];
    $tot = $pdo->query(
        "SELECT estado_verificacion, COUNT(*) AS cantidad
           FROM empresas
          GROUP BY estado_verificacion"
    )->fetchAll();
    foreach ($tot as $t) {
        $k = strtolower(trim((string) $t['estado_verificacion']));
        if (isset($totalesPorEstado[$k])) {
            $totalesPorEstado[$k] = (int) $t['cantidad'];
        }
    }

    echo json_encode([
        "status"   => "ok",
        "total"    => count($rows),
        "totales"  => $totalesPorEstado,
        "data"     => $rows,
    ]);
} catch (Throwable $e) {
    respond_error(500, 'No se pudo obtener el padrón.', $e);
}
