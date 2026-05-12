<?php
// Archivo: api/get_configuracion.php
require_once __DIR__ . '/jwt_helper.php';
require_once __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: " . frontend_origin());
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

load_env(__DIR__ . '/.env');
require_jwt($_ENV['JWT_SECRET'] ?? '');

$host   = $_ENV['DB_HOST'] ?? null;
$port   = $_ENV['DB_PORT'] ?? null;
$dbname = $_ENV['DB_NAME'] ?? null;
$user   = $_ENV['DB_USER'] ?? null;
$pass   = $_ENV['DB_PASS'] ?? null;

$DEFAULTS = [
    "nombre_sitio"   => "Observatorio Industrial",
    "institucion"    => "Mrio. de Desarrollo Social",
    "email_contacto" => "contacto@observatorio.gob.ar",
    "texto_footer"   => "© Observatorio Industrial - Catamarca",
];

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $stmt = $pdo->prepare(
        "SELECT contenido FROM configuracion_sitio WHERE seccion = :seccion"
    );
    $stmt->execute([':seccion' => 'general']);
    $row = $stmt->fetch();

    if (!$row) {
        $defaultJson = json_encode($DEFAULTS);
        $ins = $pdo->prepare(
            "INSERT INTO configuracion_sitio (seccion, contenido)
             VALUES ('general', :contenido)"
        );
        $ins->execute([':contenido' => $defaultJson]);

        echo json_encode([
            "status" => "ok",
            "data"   => $DEFAULTS,
            "creado" => true,
        ]);
        exit;
    }

    $contenido = $row['contenido'];
    if (is_string($contenido)) {
        $decoded = json_decode($contenido, true);
        if (is_array($decoded)) {
            $contenido = $decoded;
        }
    }

    echo json_encode([
        "status" => "ok",
        "data"   => $contenido,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
}
