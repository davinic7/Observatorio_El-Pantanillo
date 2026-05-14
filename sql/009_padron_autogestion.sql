-- =====================================================================
-- 009_padron_autogestion.sql
-- Fase 2: Autogestión y Padrón de Empresas.
-- Idempotente: se puede correr múltiples veces sin romper nada.
-- =====================================================================

-- 1) Tabla canónica (si no existe todavía).
CREATE TABLE IF NOT EXISTS empresas (
    id                   SERIAL PRIMARY KEY,
    nombre_empresa       VARCHAR(255) NOT NULL,
    rubro                VARCHAR(255),
    estado_operativo     VARCHAR(50) DEFAULT 'ACTIVA',
    responsable          VARCHAR(255),
    contacto_1           VARCHAR(50),
    contacto_2           VARCHAR(50),
    email                VARCHAR(255),
    direccion            TEXT,
    lote_id              INTEGER REFERENCES lotes(id) ON DELETE SET NULL,
    manzana              VARCHAR(50),
    estado_verificacion  VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha_registro       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2) Si la tabla ya existía con la estructura vieja, agregamos columnas faltantes.
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS nombre_empresa      VARCHAR(255);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS rubro               VARCHAR(255);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS estado_operativo    VARCHAR(50) DEFAULT 'ACTIVA';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS responsable         VARCHAR(255);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS contacto_1          VARCHAR(50);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS contacto_2          VARCHAR(50);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS email               VARCHAR(255);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS direccion           TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS lote_id             INTEGER;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS manzana             VARCHAR(50);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS estado_verificacion VARCHAR(20) NOT NULL DEFAULT 'pendiente';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS fecha_registro      TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 3) Foreign key de lote_id -> lotes(id) si todavía no está.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'empresas'
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name = 'empresas_lote_id_fkey'
    ) THEN
        BEGIN
            ALTER TABLE empresas
                ADD CONSTRAINT empresas_lote_id_fkey
                FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE SET NULL;
        EXCEPTION WHEN others THEN
            -- Si lotes no existe todavía, ignoramos: se podrá agregar después.
            NULL;
        END;
    END IF;
END $$;

-- 4) Check constraint para estado_verificacion (idempotente).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'empresas'
          AND constraint_name = 'empresas_estado_verificacion_check'
    ) THEN
        ALTER TABLE empresas
            ADD CONSTRAINT empresas_estado_verificacion_check
            CHECK (estado_verificacion IN ('pendiente', 'aprobado', 'rechazado'));
    END IF;
END $$;

-- 5) Backfill: si vienen registros de la versión anterior con la columna
--    razon_social pero sin nombre_empresa, copiamos el valor.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'empresas' AND column_name = 'razon_social'
    ) THEN
        EXECUTE 'UPDATE empresas
                    SET nombre_empresa = razon_social
                  WHERE (nombre_empresa IS NULL OR nombre_empresa = '''')
                    AND razon_social IS NOT NULL';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'empresas' AND column_name = 'email_contacto'
    ) THEN
        EXECUTE 'UPDATE empresas
                    SET email = email_contacto
                  WHERE (email IS NULL OR email = '''')
                    AND email_contacto IS NOT NULL';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'empresas' AND column_name = 'actividad_principal'
    ) THEN
        EXECUTE 'UPDATE empresas
                    SET rubro = actividad_principal
                  WHERE (rubro IS NULL OR rubro = '''')
                    AND actividad_principal IS NOT NULL';
    END IF;
END $$;

-- 6) Marcamos como ''aprobado'' los registros preexistentes para no romper la app.
UPDATE empresas
   SET estado_verificacion = 'aprobado'
 WHERE estado_verificacion IS NULL OR estado_verificacion = '' OR estado_verificacion NOT IN ('pendiente', 'aprobado', 'rechazado');

-- 7) Índice útil para el filtro del mapa público.
CREATE INDEX IF NOT EXISTS idx_empresas_estado_verificacion
    ON empresas (estado_verificacion);
