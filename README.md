# 🏭 Observatorio Parque Industrial "El Pantanillo"

Sistema de Información Geográfica (GIS) y Padrón Industrial para la gestión y monitoreo del Parque Industrial de la Provincia de Catamarca. Una plataforma de monitoreo, análisis y visualización de la actividad productiva, ocupacional y territorial del parque industrial provincial.

## 🏗️ Arquitectura del Sistema

El proyecto sigue una arquitectura desacoplada (Frontend/Backend) tipo SPA (Single Page Application) organizada en un monorepo.

| Carpeta   | Stack                                   | Rol                                |
| --------- | --------------------------------------- | ---------------------------------- |
| `/api`    | PHP puro + PostgreSQL (PDO)             | API RESTful (backend)              |
| `/client` | React + Vite + Tailwind CSS + Leaflet   | Aplicación web (frontend)          |

* **Base de Datos:** PostgreSQL (Aiven Cloud)
* **Almacenamiento Multimedia:** Cloudinary (Direct Frontend Upload)
* **Seguridad:** JWT (JSON Web Tokens) para autenticación y protección de endpoints.

## 🚀 Puesta en marcha

### Backend (`/api`)
```bash
cd api
cp .env.example .env       # configurar credenciales de PostgreSQL
php -S localhost:8000      # servidor de desarrollo

Frontend (/client)

cd client
npm install
npm run dev                # http://localhost:5173

🧩 Módulos Principales
Dashboard & Métricas: Panel gerencial con KPIs reactivos en tiempo real.

Capa Geográfica (GIS): Mapa interactivo de Leaflet que cruza información catastral con el padrón vía base de datos.

Gestor Catastral (Lotes): CRUD de terrenos con integridad referencial (ON DELETE SET NULL).

Padrón de Empresas: Gestión de industrias con subida de logotipos directa a la nube (Cloudinary).

Configuración Dinámica: Panel para modificar parámetros de la UI (textos, footers) guardados en formato JSONB.

📂 Estructura del repositorio

.
├── api/                   # Backend PHP
│   ├── config/            # Conexión a base de datos
│   ├── controllers/       # Controladores REST
│   ├── models/            # Modelos de dominio
│   └── index.php          # Front Controller
├── client/                # Frontend React
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── assets/
├── .gitignore
└── README.md

📄 Licencia
Uso institucional — Observatorio del Parque Industrial de Catamarca.

---

### 🚦 El Checkpoint del Navbar y el Siguiente Paso

Antes de cambiar de tema: **¿Llegaste a pasarle a Claude el comando del `z-50` para el Navbar?** Confirmame si al scrollear hacia abajo el mapa ya se esconde correctamente por debajo del menú superior.

Una vez que ese detalle visual esté resuelto, el volante es tuyo para elegir la próxima gran misión. Te recuerdo las tres rutas posibles:

* **Opción 1: Inteligencia Espacial (GIS).** Le metemos la librería `Turf.js` para que el sistema valide si los metros cuadrados que el usuario dibuja en el mapa coinciden con lo que declara en el formulario del Lote.
* **Opción 2: La Landing Page Pública.** Armamos una vista hermosa, sin login, para que el ciudadano común o un inversor pueda ver el mapa de El Pantanillo y las empresas radicadas (modo solo lectura).
* **Opción 3: Salto a Producción (Deploy).** Dejamos de programar localmente y nos concentramos en subir esto a internet (Vercel, servidor PHP real) para que lo puedas mostrar desde tu celular en el Ministerio.

¿Qué elegimos? 🧉🚀