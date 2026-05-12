<?php
// Archivo: api/update_lote.php
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

$id            = isset($payload['id']) && is_numeric($payload['id']) ? (int) $payload['id'] : 0;
$numero_lote   = isset($payload['numero_lote']) ? trim((string) $payload['numero_lote']) : '';
$superficieRaw = $payload['superficie_m2'] ?? null;
$sector        = isset($payload['sector']) ? trim((string) $payload['sector']) : '';
$estado        = isset($payload['estado']) ? trim((string) $payload['estado']) : '';

$empresaIdRaw = $payload['empresa_id'] ?? null;
$empresa_id   = is_numeric($empresaIdRaw) ? (int) $empresaIdRaw : null;
if ($empresa_id !== null && $empresa_id <= 0) {
    $empresa_id = null;
}

$errores = [];
if ($id <= 0)            $errores[] = 'id';
if ($numero_lote === '') $errores[] = 'numero_lote';
if ($superficieRaw === null || $superficieRaw === '' || !is_numeric($superficieRaw)) {
    $errores[] = 'superficie_m2';
}
if ($sector === '') $errores[] = 'sector';
if ($estado === '') $errores[] = 'estado';

if (!empty($errores)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "mensaje" => "Faltan o son inválidos los campos: " . implode(', ', $errores)
    ]);
    exit;
}

$superficie_m2 = (float) $superficieRaw;

try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare(
        "UPDATE lotes
            SET numero_lote   = :numero_lote,
                superficie_m2 = :superficie_m2,
                sector        = :sector,
                estado        = :estado,
                empresa_id    = :empresa_id
          WHERE id = :id"
    );
    $stmt->execute([
        ':id'            => $id,
        ':numero_lote'   => $numero_lote,
        ':superficie_m2' => $superficie_m2,
        ':sector'        => $sector,
        ':estado'        => $estado,
        ':empresa_id'    => $empresa_id,
    ]);

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
        "mensaje" => "Lote actualizado exitosamente."
    ]);
} catch (Throwable $e) {
    if ($e->getCode() === '23505') {
        http_response_code(409);
        echo json_encode([
            "status" => "error",
            "mensaje" => "El número de lote ya existe en el parque."
        ]);
        exit;
    }

    respond_error(500, 'Error interno del servidor.', $e);
}
