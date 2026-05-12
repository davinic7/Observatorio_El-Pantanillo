<?php
// Archivo: api/jwt_helper.php
// Helpers JWT (HS256) sin dependencias externas.

function base64UrlEncode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string
{
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/'));
}

/**
 * Genera un JWT con algoritmo HS256.
 */
function jwt_encode(array $payload, string $secret): string
{
    $header = ['typ' => 'JWT', 'alg' => 'HS256'];
    $headerEncoded  = base64UrlEncode(json_encode($header, JSON_UNESCAPED_SLASHES));
    $payloadEncoded = base64UrlEncode(json_encode($payload, JSON_UNESCAPED_SLASHES));
    $signature      = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", $secret, true);

    return $headerEncoded . '.' . $payloadEncoded . '.' . base64UrlEncode($signature);
}

/**
 * Decodifica y valida un JWT. Lanza RuntimeException si es inválido o expirado.
 *
 * @return array<string, mixed> payload
 */
function jwt_decode(string $token, string $secret): array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        throw new RuntimeException('Token mal formado.');
    }
    [$h, $p, $s] = $parts;

    $headerJson = base64UrlDecode($h);
    $header     = json_decode($headerJson, true);
    if (!is_array($header) || (($header['alg'] ?? null) !== 'HS256')) {
        throw new RuntimeException('Algoritmo no soportado.');
    }

    $expected = base64UrlEncode(hash_hmac('sha256', "$h.$p", $secret, true));
    if (!hash_equals($expected, $s)) {
        throw new RuntimeException('Firma inválida.');
    }

    $payload = json_decode(base64UrlDecode($p), true);
    if (!is_array($payload)) {
        throw new RuntimeException('Payload inválido.');
    }

    if (isset($payload['exp']) && time() >= (int) $payload['exp']) {
        throw new RuntimeException('Token expirado.');
    }

    return $payload;
}

/**
 * Lee el header Authorization (manejando variantes del entorno).
 */
function get_authorization_header(): string
{
    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $key => $value) {
            if (strcasecmp($key, 'Authorization') === 0) {
                return (string) $value;
            }
        }
    }
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        return (string) $_SERVER['HTTP_AUTHORIZATION'];
    }
    if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        return (string) $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    return '';
}

/**
 * Exige un JWT válido en el header Authorization. Si falla,
 * responde 401 y termina la ejecución. Devuelve el payload si pasa.
 */
function require_jwt(string $secret): array
{
    if ($secret === '') {
        http_response_code(500);
        echo json_encode([
            "status"  => "error",
            "mensaje" => "JWT_SECRET no está configurado en .env"
        ]);
        exit;
    }

    $authHeader = get_authorization_header();

    if (!preg_match('/^Bearer\s+(.+)$/i', trim($authHeader), $m)) {
        http_response_code(401);
        echo json_encode([
            "status"  => "error",
            "mensaje" => "Token no provisto."
        ]);
        exit;
    }

    $token = trim($m[1]);
    try {
        return jwt_decode($token, $secret);
    } catch (RuntimeException $e) {
        http_response_code(401);
        echo json_encode([
            "status"  => "error",
            "mensaje" => "Token inválido o expirado."
        ]);
        exit;
    }
}

/**
 * Carga variables del archivo .env en $_ENV y también en el entorno del proceso
 * (vía putenv) para que getenv() las encuentre. Si la variable ya viene seteada
 * por el entorno (ej. Render), no la pisa.
 */
function load_env(string $path): void
{
    if (!file_exists($path)) {
        return;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0 || !str_contains($line, '=')) {
            continue;
        }
        [$name, $value] = explode('=', $line, 2);
        $name  = trim($name);
        $value = trim($value);
        // Si ya existe en el entorno real (Render, etc.), respetar.
        if (getenv($name) === false) {
            putenv("$name=$value");
        }
        if (!isset($_ENV[$name])) {
            $_ENV[$name] = $value;
        }
    }
}

/**
 * Devuelve el origen permitido para CORS. Prioriza FRONTEND_URL del entorno;
 * fallback a http://localhost:5173 para desarrollo local. Asegura que el .env
 * esté cargado para que funcione aunque se llame antes que load_env explícito.
 */
function frontend_origin(): string
{
    static $cached = null;
    if ($cached !== null) {
        return $cached;
    }
    // Cargar .env si todavía no se hizo (idempotente).
    load_env(__DIR__ . '/.env');

    $v = getenv('FRONTEND_URL');
    if ($v === false || $v === '') {
        $v = $_ENV['FRONTEND_URL'] ?? '';
    }
    return $cached = ($v !== '' ? $v : 'http://localhost:5173');
}
