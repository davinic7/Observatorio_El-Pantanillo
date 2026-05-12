<?php
// Archivo: api/save_lote.php
require_once __DIR__ . '/jwt_helper.php';
require_once __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: " . frontend_origin());
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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
if ($numero_lote === '') $errores[] = 'numero_lote';
if ($superficieRaw === null || $superficieRaw === '' || !is_numeric($superficieRaw)) {
    $errores[] = 'superficie_m2';
}
if ($sector === '')      $errores[] = 'sector';
if ($estado === '')      $errores[] = 'estado';

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
        "INSERT INTO lotes (numero_lote, superficie_m2, sector, estado, empresa_id)
         VALUES (:numero_lote, :superficie_m2, :sector, :estado, :empresa_id)
         RETURNING id"
    );
    $stmt->execute([
        ':numero_lote'   => $numero_lote,
        ':superficie_m2' => $superficie_m2,
        ':sector'        => $sector,
        ':estado'        => $estado,
        ':empresa_id'    => $empresa_id,
    ]);

    $newId = (int) $stmt->fetchColumn();

    echo json_encode([
        "status"  => "ok",
        "mensaje" => "Lote registrado exitosamente.",
        "id"      => $newId
    ]);
} catch (PDOException $e) {
    // 23505 = unique_violation en PostgreSQL
    if ($e->getCode() === '23505') {
        http_response_code(409);
        echo json_encode([
            "status" => "error",
            "mensaje" => "El número de lote ya existe en el parque."
        ]);
        exit;
    }

    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "mensaje" => "Error al guardar el lote: " . $e->getMessage()
    ]);
}
