<?php
// Archivo: api/save_consulta.php — Formulario público de contacto.
require_once __DIR__ . '/jwt_helper.php';
require_once __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: " . frontend_origin());
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "mensaje" => "Método no permitido."]);
    exit;
}

load_env(__DIR__ . '/.env');

$rawBody = file_get_contents('php://input');
$payload = json_decode($rawBody, true);
if (!is_array($payload)) {
    $payload = $_POST;
}

$nombre  = isset($payload['nombre']) ? trim((string) $payload['nombre']) : '';
$email   = isset($payload['email']) ? trim((string) $payload['email']) : '';
$empresa = isset($payload['empresa']) ? trim((string) $payload['empresa']) : '';
$mensaje = isset($payload['mensaje']) ? trim((string) $payload['mensaje']) : '';

$nombre  = substr($nombre, 0, 255);
$email   = substr($email, 0, 255);
$empresa = $empresa === '' ? null : substr($empresa, 0, 255);

$errores = [];
if ($nombre === '')                                      $errores[] = 'nombre';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errores[] = 'email';
if ($mensaje === '')                                     $errores[] = 'mensaje';

if (!empty($errores)) {
    http_response_code(400);
    echo json_encode([
        "status"  => "error",
        "mensaje" => "Faltan o son inválidos: " . implode(', ', $errores),
    ]);
    exit;
}

try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare(
        "INSERT INTO consultas_contacto (nombre, email, empresa, mensaje)
         VALUES (:nombre, :email, :empresa, :mensaje)
         RETURNING id"
    );
    $stmt->execute([
        ':nombre'  => $nombre,
        ':email'   => $email,
        ':empresa' => $empresa,
        ':mensaje' => $mensaje,
    ]);

    echo json_encode([
        "status"  => "ok",
        "mensaje" => "Tu mensaje fue enviado. ¡Gracias por contactarnos!",
        "id"      => (int) $stmt->fetchColumn(),
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
}
