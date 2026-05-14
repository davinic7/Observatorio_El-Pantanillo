<?php
// Archivo: api/approve_empresa.php — JWT.
// Cambia estado_verificacion a 'aprobado' (default) o al estado pedido.
// Opcionalmente asigna lote_id si todavía no lo tenía.
require_once __DIR__ . '/jwt_helper.php';
require_once __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: " . frontend_origin());
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

load_env(__DIR__ . '/.env');
require_jwt(env_value('JWT_SECRET', ''));

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
            "status"  => "error",
            "mensaje" => "Método no permitido. Use POST.",
        ]);
        exit;
    }

    $payload = json_decode(file_get_contents('php://input'), true);
    if (!is_array($payload)) $payload = $_POST;

    $idRaw = $payload['id'] ?? null;
    $id    = is_numeric($idRaw) ? (int) $idRaw : 0;
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "mensaje" => "Id de empresa inválido."]);
        exit;
    }

    $estado = isset($payload['estado_verificacion'])
        ? trim((string) $payload['estado_verificacion'])
        : 'aprobado';
    $validos = ['pendiente', 'aprobado', 'rechazado'];
    if (!in_array($estado, $validos, true)) {
        $estado = 'aprobado';
    }

    $loteIdRaw = $payload['lote_id'] ?? null;
    $lote_id   = is_numeric($loteIdRaw) ? (int) $loteIdRaw : null;
    if ($lote_id !== null && $lote_id <= 0) $lote_id = null;

    $pdo = get_db_connection();

    // Si llega lote_id, lo asignamos solo si la empresa no tenía uno antes
    // (no pisamos un lote ya asignado por error). Si querés permitir sobreescribir,
    // sacá la condición de COALESCE.
    if ($lote_id !== null) {
        $stmt = $pdo->prepare(
            "UPDATE empresas
                SET estado_verificacion = :estado,
                    lote_id = COALESCE(lote_id, :lote_id)
              WHERE id = :id"
        );
        $stmt->execute([
            ':estado'  => $estado,
            ':lote_id' => $lote_id,
            ':id'      => $id,
        ]);
    } else {
        $stmt = $pdo->prepare(
            "UPDATE empresas
                SET estado_verificacion = :estado
              WHERE id = :id"
        );
        $stmt->execute([
            ':estado' => $estado,
            ':id'     => $id,
        ]);
    }

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            "status"  => "error",
            "mensaje" => "No existe una empresa con ese id.",
        ]);
        exit;
    }

    echo json_encode([
        "status"  => "ok",
        "mensaje" => $estado === 'aprobado'
            ? "Empresa aprobada y publicada en el padrón."
            : ($estado === 'rechazado'
                ? "Empresa rechazada."
                : "Empresa marcada como pendiente."),
        "id"      => $id,
        "nuevo_estado" => $estado,
    ]);
} catch (Throwable $e) {
    respond_error(500, 'No se pudo actualizar la verificación.', $e);
}
