<?php
// Archivo: api/get_public_config.php — endpoint PÚBLICO, sin JWT
require_once __DIR__ . '/jwt_helper.php';
require_once __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: " . frontend_origin());
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

load_env(__DIR__ . '/.env');


$DEFAULTS = [
    "nombre_sitio"   => "Observatorio Industrial",
    "institucion"    => "Mrio. de Desarrollo Social",
    "email_contacto" => "contacto@observatorio.gob.ar",
    "texto_footer"   => "© Observatorio Industrial - Catamarca",
];

try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare(
        "SELECT contenido FROM configuracion_sitio WHERE seccion = :seccion"
    );
    $stmt->execute([':seccion' => 'general']);
    $row = $stmt->fetch();

    if (!$row) {
        echo json_encode(["status" => "ok", "data" => $DEFAULTS]);
        exit;
    }

    $contenido = $row['contenido'];
    if (is_string($contenido)) {
        $decoded = json_decode($contenido, true);
        if (is_array($decoded)) {
            $contenido = $decoded;
        }
    }

    echo json_encode(["status" => "ok", "data" => $contenido]);
} catch (Throwable $e) {
    respond_error(500, 'Error interno del servidor.', $e);
}
