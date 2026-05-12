<?php
// Archivo: api/update_empresa.php
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
    echo json_encode([
        "status" => "error",
        "mensaje" => "Método no permitido. Use POST."
    ]);
    exit;
}

$rawBody = file_get_contents('php://input');
$payload = json_decode($rawBody, true);
if (!is_array($payload)) {
    $payload = $_POST;
}

$id                  = isset($payload['id']) && is_numeric($payload['id']) ? (int) $payload['id'] : 0;
$cuit                = isset($payload['cuit']) ? trim((string) $payload['cuit']) : '';
$razon_social        = isset($payload['razon_social']) ? trim((string) $payload['razon_social']) : '';
$email_contacto      = isset($payload['email_contacto']) ? trim((string) $payload['email_contacto']) : '';
$actividad_principal = isset($payload['actividad_principal']) ? trim((string) $payload['actividad_principal']) : '';

$logoRaw = $payload['logo_url'] ?? null;
$logo_url = is_string($logoRaw) ? trim($logoRaw) : '';
$logo_url = $logo_url === '' ? null : $logo_url;

$errores = [];
if ($id <= 0)                    $errores[] = 'id';
if ($cuit === '')                $errores[] = 'cuit';
if ($razon_social === '')        $errores[] = 'razon_social';
if ($email_contacto === '')      $errores[] = 'email_contacto';
if ($actividad_principal === '') $errores[] = 'actividad_principal';

if (!empty($errores)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "mensaje" => "Faltan o son inválidos los campos: " . implode(', ', $errores)
    ]);
    exit;
}

try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare(
        "UPDATE empresas
            SET cuit                = :cuit,
                razon_social        = :razon_social,
                email_contacto      = :email_contacto,
                actividad_principal = :actividad_principal,
                logo_url            = :logo_url
          WHERE id = :id"
    );
    $stmt->execute([
        ':id'                  => $id,
        ':cuit'                => $cuit,
        ':razon_social'        => $razon_social,
        ':email_contacto'      => $email_contacto,
        ':actividad_principal' => $actividad_principal,
        ':logo_url'            => $logo_url,
    ]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "mensaje" => "No existe una empresa con ese id."
        ]);
        exit;
    }

    echo json_encode([
        "status"  => "ok",
        "mensaje" => "Empresa actualizada exitosamente."
    ]);
} catch (Throwable $e) {
    if ($e->getCode() === '23505') {
        http_response_code(409);
        echo json_encode([
            "status"  => "error",
            "mensaje" => "Ya existe una empresa con ese CUIT."
        ]);
        exit;
    }

    respond_error(500, 'Error interno del servidor.', $e);
}
