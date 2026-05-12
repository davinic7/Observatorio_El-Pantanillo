<?php
// Archivo: api/save_empresa.php
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
require_jwt($_ENV['JWT_SECRET'] ?? '');

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

$cuit                = isset($payload['cuit']) ? trim((string) $payload['cuit']) : '';
$razon_social        = isset($payload['razon_social']) ? trim((string) $payload['razon_social']) : '';
$email_contacto      = isset($payload['email_contacto']) ? trim((string) $payload['email_contacto']) : '';
$actividad_principal = isset($payload['actividad_principal']) ? trim((string) $payload['actividad_principal']) : '';

$logoRaw = $payload['logo_url'] ?? null;
$logo_url = is_string($logoRaw) ? trim($logoRaw) : '';
$logo_url = $logo_url === '' ? null : $logo_url;

$errores = [];
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
        "INSERT INTO empresas (cuit, razon_social, email_contacto, actividad_principal, logo_url)
         VALUES (:cuit, :razon_social, :email_contacto, :actividad_principal, :logo_url)
         RETURNING id"
    );
    $stmt->execute([
        ':cuit'                => $cuit,
        ':razon_social'        => $razon_social,
        ':email_contacto'      => $email_contacto,
        ':actividad_principal' => $actividad_principal,
        ':logo_url'            => $logo_url,
    ]);

    $newId = (int) $stmt->fetchColumn();

    echo json_encode([
        "status"  => "ok",
        "mensaje" => "Empresa registrada exitosamente.",
        "id"      => $newId
    ]);
} catch (PDOException $e) {
    if ($e->getCode() === '23505') {
        http_response_code(409);
        echo json_encode([
            "status"  => "error",
            "mensaje" => "Ya existe una empresa con ese CUIT."
        ]);
        exit;
    }

    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "mensaje" => $e->getMessage()
    ]);
}
