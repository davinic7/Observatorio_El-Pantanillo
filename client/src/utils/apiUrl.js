// URL base del backend. Configurable vía variable de entorno de Vite.
// En dev cae a localhost:8000; en build se reemplaza con lo que esté en .env.production
// o en las env vars del hosting (Render, Vercel, etc.).
export const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000';
