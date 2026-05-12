CREATE TABLE IF NOT EXISTS declaraciones_juradas (
    id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresas(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    archivo_url TEXT, -- Link a Cloudinary (PDF o Imagen)
    fecha_presentacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'Presentado' -- 'Presentado', 'En Revisión', 'Aprobado'
);

