<?php
// Archivo: api/mark_consulta_leida.php — Marca consulta como leída (o no leída).
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "mensaje" => "Método no permitido."]);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);
if (!is_array($payload)) $payload = $_POST;

$id    = isset($payload['id']) && is_numeric($payload['id']) ? (int) $payload['id'] : 0;
$leida = isset($payload['leida']) ? (bool) $payload['leida'] : true;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "mensaje" => "Id inválido."]);
    exit;
}

try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare("UPDATE consultas_contacto SET leida = :leida WHERE id = :id");
    $stmt->execute([':leida' => $leida ? 't' : 'f', ':id' => $id]);

    echo json_encode([
        "status"  => "ok",
        "mensaje" => $leida ? "Marcada como leída." : "Marcada como no leída.",
    ]);
} catch (Throwable $e) {
    respond_error(500, 'Error interno del servidor.', $e);
}
