-- 1. Borramos la tabla y sus relaciones de forma segura
DROP TABLE IF EXISTS lotes CASCADE;

-- 2. Volvemos a crearla con la estructura completa
CREATE TABLE lotes (
    id SERIAL PRIMARY KEY,
    numero_lote VARCHAR(50) UNIQUE NOT NULL, -- Mantenemos tu nombre original
    sector VARCHAR(50), 
    superficie_m2 DECIMAL(10, 2),
    estado lote_estado DEFAULT 'disponible', -- Usamos tu ENUM original
    propietario VARCHAR(100),
    geometria_terreno JSONB NULL, -- Mantenemos tu columna de mapas
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Volvemos a vincular la tabla empresas (para que no quede rota la relación)
ALTER TABLE empresas 
ADD CONSTRAINT empresas_lote_id_fkey 
FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE SET NULL;

-- 4. Insertamos datos de prueba alineados a esta estructura
INSERT INTO lotes (numero_lote, sector, superficie_m2, estado, propietario) VALUES
('LOTE-001', 'Sector Norte', 1500.00, 'ocupado', 'Textil Catamarca S.A.'),
('LOTE-002', 'Sector Industrial', 2200.50, 'disponible', NULL),
('LOTE-003', 'Sector Servicios', 1800.00, 'reservado', 'Logística NOA'),
('LOTE-004', 'Sector Sur', 3000.00, 'ocupado', 'Aceitera del Valle');