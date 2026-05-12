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

$email = isset($payload['email']) ? trim((string) $payload['email']) : '';
$password = isset($payload['password']) ? (string) $payload['password'] : '';

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "mensaje" => "Email y contraseña son obligatorios."
    ]);
    exit;
}

$envPath = __DIR__ . '/.env';
if (!file_exists($envPath)) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "mensaje" => "No se encuentra el archivo .env"
    ]);
    exit;
}

$lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($lines as $line) {
    if (strpos(trim($line), '#') === 0) continue;
    if (!str_contains($line, '=')) continue;
    list($name, $value) = explode('=', $line, 2);
    $_ENV[trim($name)] = trim($value);
}

try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare(
        "SELECT id, email, rol, password_hash FROM usuarios WHERE email = :email LIMIT 1"
    );
    $stmt->execute([':email' => $email]);
    $usuario = $stmt->fetch();

    if (!$usuario || !password_verify($password, $usuario['password_hash'])) {
        http_response_code(401);
        echo json_encode([
            "status" => "error",
            "mensaje" => "Credenciales inválidas"
        ]);
        exit;
    }

    $jwtSecret = $_ENV['JWT_SECRET'] ?? '';
    if ($jwtSecret === '') {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "mensaje" => "JWT_SECRET no está configurado en .env"
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
        "token" => $token
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "mensaje" => "Error en la autenticación: " . $e->getMessage()
    ]);
}
