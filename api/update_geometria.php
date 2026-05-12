<?php
// Archivo: api/update_geometria.php
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

$id = isset($payload['id']) && is_numeric($payload['id']) ? (int) $payload['id'] : 0;
$geometria = $payload['geometria_terreno'] ?? null;

// Si vino como objeto/array, lo serializamos a string JSON.
if (is_array($geometria)) {
    $geometria = json_encode($geometria);
}

if ($id <= 0) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "mensaje" => "Debe enviar un id de lote válido."
    ]);
    exit;
}

if (!is_string($geometria) || $geometria === '' || json_decode($geometria) === null) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "mensaje" => "La geometría debe ser un string JSON válido."
    ]);
    exit;
}

try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare(
        "UPDATE lotes SET geometria_terreno = :geo WHERE id = :id"
    );
    $stmt->execute([
        ':geo' => $geometria,
        ':id'  => $id,
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
        "mensaje" => "Geometría actualizada exitosamente."
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "mensaje" => "Error al guardar la geometría: " . $e->getMessage()
    ]);
}
