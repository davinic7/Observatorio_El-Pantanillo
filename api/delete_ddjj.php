<?php
// Archivo: api/delete_ddjj.php — JWT. DELETE FROM declaraciones_juradas WHERE id = :id.
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
    echo json_encode(["status" => "error", "mensaje" => "Método no permitido."]);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);
if (!is_array($payload)) $payload = $_POST;

$idRaw = $payload['id'] ?? $_GET['id'] ?? null;
$id = is_numeric($idRaw) ? (int) $idRaw : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "mensaje" => "Id inválido."]);
    exit;
}

try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare("DELETE FROM declaraciones_juradas WHERE id = :id");
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(["status" => "error", "mensaje" => "No existe la DDJJ."]);
        exit;
    }

    echo json_encode(["status" => "ok", "mensaje" => "DDJJ eliminada."]);
} catch (Throwable $e) {
    respond_error(500, 'Error interno del servidor.', $e);
}
