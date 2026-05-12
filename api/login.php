<?php
// Archivo: api/login.php
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

// Carga .env si existe (local). En Render no hay archivo y las vars vienen del entorno.
load_env(__DIR__ . '/.env');

$debug = strtolower((string) env_value('APP_DEBUG', '')) === 'true';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
            "status"  => "error",
            "mensaje" => "Método no permitido. Use POST."
        ]);
        exit;
    }

    $rawBody = file_get_contents('php://input');
    $payload = json_decode($rawBody, true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $email    = isset($payload['email']) ? trim((string) $payload['email']) : '';
    $password = isset($payload['password']) ? (string) $payload['password'] : '';

    if ($email === '' || $password === '') {
        http_response_code(400);
        echo json_encode([
            "status"  => "error",
            "mensaje" => "Email y contraseña son obligatorios."
        ]);
        exit;
    }

    $jwtSecret = env_value('JWT_SECRET', '');
    if ($jwtSecret === '') {
        http_response_code(500);
        echo json_encode([
            "status"  => "error",
            "mensaje" => "JWT_SECRET no está configurado en el entorno."
        ]);
        exit;
    }

    $pdo = get_db_connection();
    $stmt = $pdo->prepare(
        "SELECT id, email, rol, password_hash FROM usuarios WHERE email = :email LIMIT 1"
    );
    $stmt->execute([':email' => $email]);
    $usuario = $stmt->fetch();

    if (!$usuario || !password_verify($password, $usuario['password_hash'])) {
        http_response_code(401);
        echo json_encode([
            "status"  => "error",
            "mensaje" => "Credenciales inválidas"
        ]);
        exit;
    }

    $now = time();
    $token = jwt_encode([
        "id"  => (int) $usuario['id'],
        "rol" => $usuario['rol'],
        "iat" => $now,
        "exp" => $now + (8 * 60 * 60),
    ], $jwtSecret);

    echo json_encode([
        "status" => "ok",
        "user" => [
            "id"    => (int) $usuario['id'],
            "email" => $usuario['email'],
            "rol"   => $usuario['rol'],
        ],
        "token" => $token,
    ]);
} catch (Throwable $e) {
    // Log siempre al error log del servidor (visible en Render Logs).
    error_log('[login.php] ' . $e::class . ': ' . $e->getMessage()
        . ' en ' . $e->getFile() . ':' . $e->getLine());

    http_response_code(500);
    $body = [
        "status"  => "error",
        "mensaje" => "Error interno del servidor.",
    ];
    if ($debug) {
        $body['debug'] = [
            "type"    => $e::class,
            "message" => $e->getMessage(),
            "file"    => basename($e->getFile()),
            "line"    => $e->getLine(),
        ];
    }
    echo json_encode($body);
}
