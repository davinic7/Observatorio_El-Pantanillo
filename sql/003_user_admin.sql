-- Borramos usuarios de prueba anteriores para evitar conflictos
DELETE FROM usuarios WHERE email = 'admin@observatorio.com';

-- Insertamos un usuario administrador
-- La contraseña es 'catamarca2026' (hasheada con Bcrypt)
INSERT INTO usuarios (email, password_hash, rol, estado) 
VALUES (
    'admin@observatorio.com', 
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'ministerio', 
    'activo'
);