# Usamos la imagen oficial de PHP 8.2 con el servidor Apache incorporado
FROM php:8.2-apache

# Instalamos las librerías del sistema necesarias para que PHP hable con PostgreSQL
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql pgsql

# Habilitamos mod_rewrite de Apache (siempre es buena práctica por si usamos .htaccess)
RUN a2enmod rewrite

# Copiamos todo el contenido de nuestra carpeta api/ a la carpeta pública del servidor
COPY . /var/www/html/

# Le damos los permisos correctos a Apache para que pueda leer los archivos
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Le decimos a Render que nuestro servidor escucha en el puerto 80
EXPOSE 80