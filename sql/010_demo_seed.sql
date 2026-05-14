-- =====================================================================
-- 010_demo_seed.sql
-- Reset controlado del padrón de empresas para la demo en producción.
-- Mantiene los usuarios admin (otra tabla) y la estructura de lotes.
-- =====================================================================

-- Relajamos los NOT NULL de las columnas legacy (cuit, razon_social,
-- email_contacto, actividad_principal) — la Fase 2 ya las migró a las nuevas
-- (nombre_empresa, email, rubro), pero el schema original las marcaba como
-- NOT NULL y eso bloquea inserts que solo usan las columnas nuevas.
DO $$
BEGIN
    BEGIN ALTER TABLE empresas ALTER COLUMN cuit                DROP NOT NULL; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER TABLE empresas ALTER COLUMN razon_social        DROP NOT NULL; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER TABLE empresas ALTER COLUMN email_contacto      DROP NOT NULL; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER TABLE empresas ALTER COLUMN actividad_principal DROP NOT NULL; EXCEPTION WHEN others THEN NULL; END;
END $$;

-- Limpiar tabla de empresas (los usuarios admin NO dependen de esta tabla).
DELETE FROM empresas;

-- Reiniciar el contador de IDs (PostgreSQL).
ALTER SEQUENCE empresas_id_seq RESTART WITH 1;

-- 1. Empresas reales (APROBADAS para poblar el mapa).
--    Se asignan lote_id 1, 2 y 3 asumiendo que existen en la tabla lotes.
INSERT INTO empresas (
    nombre_empresa, rubro, estado_operativo, responsable,
    contacto_1, direccion, lote_id, estado_verificacion
) VALUES
('ALGODONERA DEL VALLE S.A.', 'TEXTIL',       'Activa', 'Ing. Carlos Pinetta', '383-4205107', 'Parque Industrial El Pantanillo', 1, 'aprobado'),
('CONFECAT S.A.',             'TEXTIL',       'Activa', 'Carlos Muia',         '383-4507380', 'Parque Industrial El Pantanillo', 2, 'aprobado'),
('ABC CONSTRUCCIONES S.R.L.', 'CONSTRUCCION', 'Activa', 'César Bursi',         '383-4781396', 'Parque Industrial El Pantanillo', 3, 'aprobado');

-- 2. Empresa de prueba (PENDIENTE para la demo en vivo).
INSERT INTO empresas (
    nombre_empresa, rubro, estado_operativo, responsable,
    contacto_1, email, direccion, manzana, estado_verificacion
) VALUES
('TECNOLOGÍA ANDINA S.A.', 'TECNOLOGIA', 'En gestión', 'Laura Martínez',
 '383-4998877', 'contacto@tecnologia-andina.com', 'Sector C', 'C', 'pendiente');
