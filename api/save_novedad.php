<?php
// Archivo: api/save_novedad.php — Insert o Update con JWT.
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
    echo json_encode(["status" => "error", "mensaje" => "Método no permitido."]);
    exit;
}

$rawBody = file_get_contents('php://input');
$payload = json_decode($rawBody, true);
if (!is_array($payload)) {
    $payload = $_POST;
}

$id        = isset($payload['id']) && is_numeric($payload['id']) ? (int) $payload['id'] : 0;
$titulo    = isset($payload['titulo']) ? trim((string) $payload['titulo']) : '';
$contenido = isset($payload['contenido']) ? trim((string) $payload['contenido']) : '';

// Red de seguridad: truncar título a 255 chars para no romper la DB.
$titulo = substr($titulo, 0, 255);

$imagenRaw = $payload['imagen_url'] ?? null;
$imagen_url = is_string($imagenRaw) ? trim($imagenRaw) : '';
$imagen_url = $imagen_url === '' ? null : $imagen_url;

$activo = isset($payload['activo'])
    ? (bool) $payload['activo']
    : (isset($payload['activa']) ? (bool) $payload['activa'] : true);

$errores = [];
if ($titulo === '')    $errores[] = 'titulo';
if ($contenido === '') $errores[] = 'contenido';

if (!empty($errores)) {
    http_response_code(400);
    echo json_encode([
        "status"  => "error",
        "mensaje" => "Faltan campos: " . implode(', ', $errores),
    ]);
    exit;
}

try {
    $pdo = get_db_connection();
    if ($id > 0) {
        $stmt = $pdo->prepare(
            "UPDATE novedades
                SET titulo     = :titulo,
                    contenido  = :contenido,
                    imagen_url = :imagen_url,
                    activo     = :activo
              WHERE id = :id"
        );
        $stmt->execute([
            ':id'         => $id,
            ':titulo'     => $titulo,
            ':contenido'  => $contenido,
            ':imagen_url' => $imagen_url,
            ':activo'     => $activo ? 't' : 'f',
        ]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode([
                "status"  => "error",
                "mensaje" => "No existe la novedad con ese id.",
            ]);
            exit;
        }

        echo json_encode([
            "status"  => "ok",
            "mensaje" => "Novedad actualizada exitosamente.",
            "id"      => $id,
        ]);
    } else {
        $stmt = $pdo->prepare(
            "INSERT INTO novedades (titulo, contenido, imagen_url, activo)
             VALUES (:titulo, :contenido, :imagen_url, :activo)
             RETURNING id"
        );
        $stmt->execute([
            ':titulo'     => $titulo,
            ':contenido'  => $contenido,
            ':imagen_url' => $imagen_url,
            ':activo'     => $activo ? 't' : 'f',
        ]);
        $newId = (int) $stmt->fetchColumn();

        echo json_encode([
            "status"  => "ok",
            "mensaje" => "Novedad publicada exitosamente.",
            "id"      => $newId,
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
}
