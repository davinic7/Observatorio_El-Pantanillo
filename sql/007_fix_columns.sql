-- Si quedó al revés, alinear:
ALTER TABLE novedades RENAME COLUMN activa TO activo;
ALTER TABLE consultas_contacto RENAME COLUMN fecha TO fecha_envio;