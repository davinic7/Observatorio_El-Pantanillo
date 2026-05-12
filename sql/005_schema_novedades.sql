-- TABLA DE NOVEDADES (Módulo de Comunicación Institucional)
CREATE TABLE IF NOT EXISTS novedades (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    subtitulo VARCHAR(255),
    contenido TEXT NOT NULL,
    imagen_url TEXT,
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- OPCIONAL: Para que las noticias salgan ordenadas por la más reciente
CREATE INDEX idx_novedades_fecha ON novedades (fecha_publicacion DESC);