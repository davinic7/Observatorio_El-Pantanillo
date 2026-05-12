<?php
require_once __DIR__ . '/jwt_helper.php';
require_once __DIR__ . '/db.php';
header("Access-Control-Allow-Origin: " . frontend_origin());
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
// Archivo: api/test.php
header('Content-Type: application/json');

$envPath = __DIR__ . '/.env';
if (!file_exists($envPath)) {
    die(json_encode(["status" => "error", "mensaje" => "No se encuentra el archivo .env"]));
}

// Leemos el archivo .env manualmente para esta prueba
$lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($lines as $line) {
    if (strpos(trim($line), '#') === 0) continue;
    list($name, $value) = explode('=', $line, 2);
    $_ENV[trim($name)] = trim($value);
}

$host = $_ENV['DB_HOST'];
$port = $_ENV['DB_PORT'];
$dbname = $_ENV['DB_NAME'];
$user = $_ENV['DB_USER'];
$pass = $_ENV['DB_PASS'];

try {
    // Intentamos conectar el caño con Aiven usando PDO
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    
    // Si llegamos acá, la conexión fue exitosa. Le pedimos a Postgres su versión.
    $stmt = $pdo->query("SELECT version()");
    $version = $stmt->fetchColumn();
    
    echo json_encode([
        "status" => "ok",
        "mensaje" => "¡El caño no pierde! Conectado a Aiven con éxito.",
        "version_postgres" => $version
    ]);
} catch (PDOException $e) {
    // Si el caño pierde, capturamos el error
    echo json_encode([
        "status" => "error",
        "mensaje" => "Fuga detectada: " . $e->getMessage()
    ]);
}