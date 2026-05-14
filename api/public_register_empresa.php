<?php
// Archivo: api/public_register_empresa.php — PÚBLICO (sin JWT).
// Las altas se guardan con estado_verificacion='pendiente' hasta que un gestor las apruebe.
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

load_env(__DIR__ . '/.env');

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

    $nombre_empresa   = trim((string) ($payload['nombre_empresa'] ?? ''));
    $rubro            = trim((string) ($payload['rubro'] ?? ''));
    $estado_operativo = trim((string) ($payload['estado_operativo'] ?? 'ACTIVA'));
    $responsable      = trim((string) ($payload['responsable'] ?? ''));
    $contacto_1       = trim((string) ($payload['contacto_1'] ?? ''));
    $contacto_2       = trim((string) ($payload['contacto_2'] ?? ''));
    $email            = trim((string) ($payload['email'] ?? ''));
    $direccion        = trim((string) ($payload['direccion'] ?? ''));
    $manzana          = trim((string) ($payload['manzana'] ?? ''));

    $loteIdRaw = $payload['lote_id'] ?? null;
    $lote_id   = is_numeric($loteIdRaw) ? (int) $loteIdRaw : null;
    if ($lote_id !== null && $lote_id <= 0) $lote_id = null;

    // Truncado defensivo
    $nombre_empresa   = substr($nombre_empresa, 0, 255);
    $rubro            = substr($rubro, 0, 255) ?: null;
    $estado_operativo = substr($estado_operativo, 0, 50) ?: 'ACTIVA';
    $responsable      = substr($responsable, 0, 255) ?: null;
    $contacto_1       = substr($contacto_1, 0, 50) ?: null;
    $contacto_2       = substr($contacto_2, 0, 50) ?: null;
    $email            = substr($email, 0, 255);
    $direccion        = $direccion === '' ? null : $direccion;
    $manzana          = substr($manzana, 0, 50) ?: null;

    $errores = [];
    if ($nombre_empresa === '') $errores[] = 'nombre_empresa';
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errores[] = 'email';
    if ($responsable === null)  $errores[] = 'responsable';
    if ($contacto_1 === null)   $errores[] = 'contacto_1';

    if (!empty($errores)) {
        http_response_code(400);
        echo json_encode([
            "status"  => "error",
            "mensaje" => "Faltan o son inválidos los campos: " . implode(', ', $errores),
        ]);
        exit;
    }

    $pdo = get_db_connection();
    $stmt = $pdo->prepare(
        "INSERT INTO empresas (
            nombre_empresa, rubro, estado_operativo, responsable,
            contacto_1, contacto_2, email, direccion,
            lote_id, manzana, estado_verificacion
         ) VALUES (
            :nombre_empresa, :rubro, :estado_operativo, :responsable,
            :contacto_1, :contacto_2, :email, :direccion,
            :lote_id, :manzana, 'pendiente'
         ) RETURNING id"
    );
    $stmt->execute([
        ':nombre_empresa'   => $nombre_empresa,
        ':rubro'            => $rubro,
        ':estado_operativo' => $estado_operativo,
        ':responsable'      => $responsable,
        ':contacto_1'       => $contacto_1,
        ':contacto_2'       => $contacto_2,
        ':email'            => $email,
        ':direccion'        => $direccion,
        ':lote_id'          => $lote_id,
        ':manzana'          => $manzana,
    ]);

    echo json_encode([
        "status"  => "ok",
        "mensaje" => "Tu solicitud fue registrada. Un gestor la revisará a la brevedad.",
        "id"      => (int) $stmt->fetchColumn(),
    ]);
} catch (Throwable $e) {
    respond_error(500, 'No se pudo registrar la empresa.', $e);
}
