<?php
// Archivo: api/delete_lote.php
require_once __DIR__ . '/jwt_helper.php';
require_once __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: " . frontend_origin());
header("Access-Control-Allow-Methods: POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

load_env(__DIR__ . '/.env');
require_jwt(env_value('JWT_SECRET', ''));

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST' && $method !== 'DELETE') {
    http_response_code(405);
    echo json_encode([
        "status" => "error",
        "mensaje" => "Método no permitido. Use POST o DELETE."
    ]);
    exit;
}

$rawBody = file_get_contents('php://input');
$payload = json_decode($rawBody, true);
if (!is_array($payload)) {
    $payload = $_POST;
}

$idRaw = $payload['id'] ?? $_GET['id'] ?? null;
$id = is_numeric($idRaw) ? (int) $idRaw : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "mensaje" => "Debe enviar un id de lote válido."
    ]);
    exit;
}

try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare("DELETE FROM lotes WHERE id = :id");
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "mensaje" => "No existe un lote con ese id."
        ]);
        exit;
    }

    echo json_encode([
        "status"  => "ok",
        "mensaje" => "Lote eliminado del sistema."
    ]);
} catch (Throwable $e) {
    // 23503 = foreign_key_violation
    if ($e->getCode() === '23503') {
        http_response_code(409);
        echo json_encode([
            "status" => "error",
            "mensaje" => "No se puede eliminar el lote porque tiene registros asociados."
        ]);
        exit;
    }

    respond_error(500, 'Error interno del servidor.', $e);
}
