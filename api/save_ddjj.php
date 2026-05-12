<?php
// Archivo: api/save_ddjj.php — JWT. INSERT en declaraciones_juradas.
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
    echo json_encode(["status" => "error", "mensaje" => "Método no permitido."]);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);
if (!is_array($payload)) $payload = $_POST;

$id          = isset($payload['id']) && is_numeric($payload['id']) ? (int) $payload['id'] : 0;
$empresa_id  = isset($payload['empresa_id']) && is_numeric($payload['empresa_id'])
    ? (int) $payload['empresa_id']
    : 0;
$titulo      = isset($payload['titulo']) ? trim((string) $payload['titulo']) : '';
$descripcion = isset($payload['descripcion']) ? trim((string) $payload['descripcion']) : '';
$archivo_url = isset($payload['archivo_url']) ? trim((string) $payload['archivo_url']) : '';
$estado      = isset($payload['estado']) ? trim((string) $payload['estado']) : 'Presentado';

$titulo = substr($titulo, 0, 255);
$estado = substr($estado, 0, 50);
$descripcion = $descripcion === '' ? null : $descripcion;

$estadosValidos = ['Presentado', 'En Revisión', 'Aprobado'];
if (!in_array($estado, $estadosValidos, true)) {
    $estado = 'Presentado';
}

$errores = [];
if ($empresa_id <= 0)    $errores[] = 'empresa_id';
if ($titulo === '')      $errores[] = 'titulo';
if ($archivo_url === '') $errores[] = 'archivo_url';

if (!empty($errores)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "mensaje" => "Faltan: " . implode(', ', $errores),
    ]);
    exit;
}

try {
    $pdo = get_db_connection();
    if ($id > 0) {
        $stmt = $pdo->prepare(
            "UPDATE declaraciones_juradas
                SET empresa_id  = :empresa_id,
                    titulo      = :titulo,
                    descripcion = :descripcion,
                    archivo_url = :archivo_url,
                    estado      = :estado
              WHERE id = :id"
        );
        $stmt->execute([
            ':id'          => $id,
            ':empresa_id'  => $empresa_id,
            ':titulo'      => $titulo,
            ':descripcion' => $descripcion,
            ':archivo_url' => $archivo_url,
            ':estado'      => $estado,
        ]);
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode([
                "status"  => "error",
                "mensaje" => "No existe la DDJJ con ese id.",
            ]);
            exit;
        }
        echo json_encode([
            "status"  => "ok",
            "mensaje" => "DDJJ actualizada exitosamente.",
            "id"      => $id,
        ]);
    } else {
        $stmt = $pdo->prepare(
            "INSERT INTO declaraciones_juradas (empresa_id, titulo, descripcion, archivo_url, estado)
             VALUES (:empresa_id, :titulo, :descripcion, :archivo_url, :estado)
             RETURNING id"
        );
        $stmt->execute([
            ':empresa_id'  => $empresa_id,
            ':titulo'      => $titulo,
            ':descripcion' => $descripcion,
            ':archivo_url' => $archivo_url,
            ':estado'      => $estado,
        ]);

        echo json_encode([
            "status"  => "ok",
            "mensaje" => "DDJJ guardada exitosamente.",
            "id"      => (int) $stmt->fetchColumn(),
        ]);
    }
} catch (Throwable $e) {
    if ($e->getCode() === '23503') {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "mensaje" => "La empresa indicada no existe.",
        ]);
        exit;
    }
    respond_error(500, 'Error interno del servidor.', $e);
}
