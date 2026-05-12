<?php
// Archivo: api/update_configuracion.php
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

// Aceptamos tanto el contenido directo como envuelto en { contenido: {...} }
$contenido = isset($payload['contenido']) && is_array($payload['contenido'])
    ? $payload['contenido']
    : $payload;

if (!is_array($contenido) || empty($contenido)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "mensaje" => "El contenido enviado no es válido."
    ]);
    exit;
}

$contenidoJson = json_encode($contenido);

try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare(
        "UPDATE configuracion_sitio
            SET contenido = :contenido
          WHERE seccion = 'general'"
    );
    $stmt->execute([':contenido' => $contenidoJson]);

    if ($stmt->rowCount() === 0) {
        $ins = $pdo->prepare(
            "INSERT INTO configuracion_sitio (seccion, contenido)
             VALUES ('general', :contenido)"
        );
        $ins->execute([':contenido' => $contenidoJson]);
    }

    echo json_encode([
        "status"  => "ok",
        "mensaje" => "Configuración guardada exitosamente.",
        "data"    => $contenido,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
}
