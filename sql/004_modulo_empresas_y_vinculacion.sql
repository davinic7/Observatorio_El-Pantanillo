UPDATE lotes
SET geometria_terreno = '{
  "type": "Polygon",
  "coordinates": [
    [
      [-65.803000, -28.530000],
      [-65.801000, -28.530000],
      [-65.801000, -28.532000],
      [-65.803000, -28.532000],
      [-65.803000, -28.530000]
    ]
  ]
}'
WHERE numero_lote = 'LOTE-001';

ALTER TABLE empresas
ADD COLUMN actividad_principal VARCHAR(255),
ADD COLUMN capacidad_instalada VARCHAR(255),
ADD COLUMN empleados_totales INT;

ALTER TABLE empresas ALTER COLUMN usuario_id DROP NOT NULL;

ALTER TABLE lotes 
ADD COLUMN empresa_id INTEGER REFERENCES empresas(id) ON DELETE SET NULL;