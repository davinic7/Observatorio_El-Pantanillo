<?php
// Archivo: api/db.php
// Conexión PDO centralizada. Lee credenciales desde getenv() (Render, Docker, etc.)
// con fallback a $_ENV (.env local) y valores por defecto para desarrollo.

require_once __DIR__ . '/jwt_helper.php';

function env_value(string $key, ?string $fallback = null): ?string
{
    $v = getenv($key);
    if ($v !== false && $v !== '') {
        return $v;
    }
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
        return $_ENV[$key];
    }
    return $fallback;
}

/**
 * Responde con un error JSON. Si APP_DEBUG=true en el entorno y se pasa una
 * excepción, agrega un bloque "debug" con el detalle real. Siempre loguea
 * la excepción al error_log para verla en Render Logs.
 */
function respond_error(int $code, string $message, ?Throwable $e = null): void
{
    if ($e !== null) {
        error_log('[api] ' . get_class($e) . ': ' . $e->getMessage()
            . ' en ' . $e->getFile() . ':' . $e->getLine());
    }
    $debug = strtolower((string) env_value('APP_DEBUG', '')) === 'true';
    http_response_code($code);
    $body = ["status" => "error", "mensaje" => $message];
    if ($debug && $e !== null) {
        $body['debug'] = [
            "type"    => get_class($e),
            "message" => $e->getMessage(),
            "file"    => basename($e->getFile()),
            "line"    => $e->getLine(),
        ];
    }
    echo json_encode($body);
}

function get_db_connection(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    // Garantizamos que las vars del .env estén disponibles también vía getenv.
    load_env(__DIR__ . '/.env');

    $host = env_value('DB_HOST', 'localhost');
    $port = env_value('DB_PORT', '5432');
    $name = env_value('DB_NAME', 'observatorio_industrial');
    $user = env_value('DB_USER', 'postgres');
    // Soportar tanto DB_PASSWORD (estándar Render) como DB_PASS (compat .env existente).
    $pass = env_value('DB_PASSWORD', env_value('DB_PASS', ''));

    $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s', $host, $port, $name);
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    return $pdo;
}
