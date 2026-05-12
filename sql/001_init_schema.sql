-- ==============================================================================
-- PROYECTO: Observatorio Parque Industrial
-- MOTOR: PostgreSQL
-- FASES: 1 (Identidad y Accesos) y 2 (Corazón Geográfico)
-- ==============================================================================

-- 0. Creación de Tipos ENUM (Reglas estrictas de negocio)
CREATE TYPE usuario_rol AS ENUM ('ministerio', 'empresa');
CREATE TYPE usuario_estado AS ENUM ('pendiente', 'activo', 'suspendido', 'inactivo');
CREATE TYPE lote_estado AS ENUM ('disponible', 'ocupado', 'reservado');

-- 1. Tabla de Usuarios (Autenticación y Seguridad)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol usuario_rol NOT NULL,
    estado usuario_estado DEFAULT 'pendiente',
    token_recuperacion VARCHAR(255) NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP NULL
);

-- 2. Tabla de Configuración del Sitio (UI/UX Dinámica)
CREATE TABLE configuracion_sitio (
    id SERIAL PRIMARY KEY,
    seccion VARCHAR(50) UNIQUE NOT NULL,
    contenido JSONB NOT NULL,
    actualizado_por INT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- 3. Tabla de Lotes (Capa Catastral - Exclusiva del Ministerio)
CREATE TABLE lotes (
    id SERIAL PRIMARY KEY,
    numero_lote VARCHAR(50) UNIQUE NOT NULL,
    estado lote_estado DEFAULT 'disponible',
    geometria_terreno JSONB NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Empresas (Perfil Público y Capa de Infraestructura)
CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    lote_id INT NULL,
    cuit VARCHAR(11) UNIQUE NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    email_contacto VARCHAR(255) NOT NULL,
    descripcion TEXT NULL,
    logo_url VARCHAR(500) NULL,
    geometria_planta JSONB NULL,
    visitas_perfil INT DEFAULT 0,
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE SET NULL
);

-- 5. Tabla de Galería de Empresas (Imágenes adicionales)
CREATE TABLE empresa_imagenes (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL,
    imagen_url VARCHAR(500) NOT NULL,
    orden INT DEFAULT 0,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);