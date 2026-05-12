import { useEffect, useState } from 'react';
import { cldOptimize } from '../utils/cloudinary';
import { API_URL } from '../utils/apiUrl';

function formatFecha(value) {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

function NovedadDetalleModal({ novedad, onClose }) {
  if (!novedad) return null;
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white border border-sage/20 rounded-2xl shadow-xl overflow-hidden max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {novedad.imagen_url && (
          <img
            src={cldOptimize(novedad.imagen_url, 1200)}
            alt={novedad.titulo}
            className="w-full h-56 sm:h-64 object-cover"
          />
        )}
        <div className="px-6 py-4 border-b border-sage/15 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-moss font-semibold mb-1">
              {formatFecha(novedad.fecha_publicacion)}
            </p>
            <h3 className="font-serif text-2xl text-bark leading-tight">
              {novedad.titulo}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 text-bark/50 hover:text-bark transition-colors w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-cream/60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto whitespace-pre-line text-bark leading-relaxed">
          {novedad.contenido}
        </div>
        <div className="px-6 py-4 border-t border-sage/15 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-bark text-cream hover:bg-bark/80 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function NovedadCard({ novedad, onClickLeer }) {
  return (
    <article className="bg-white border border-sage/20 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="aspect-[16/10] bg-sage/10 overflow-hidden">
        {novedad.imagen_url ? (
          <img
            src={cldOptimize(novedad.imagen_url, 600)}
            alt={novedad.titulo}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sage/40 text-4xl font-serif">
            ◇
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs uppercase tracking-widest text-moss font-semibold mb-2">
          {formatFecha(novedad.fecha_publicacion)}
        </p>
        <h3 className="font-serif text-lg text-bark leading-snug mb-2 line-clamp-2">
          {novedad.titulo}
        </h3>
        <p className="text-sm text-bark/70 line-clamp-3 mb-4">{novedad.contenido}</p>
        <button
          type="button"
          onClick={() => onClickLeer(novedad)}
          className="mt-auto self-start text-sage hover:text-moss text-sm font-medium inline-flex items-center gap-1.5 transition-colors"
        >
          Leer más
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </article>
  );
}

export default function NoticiasPage({ onBack }) {
  const [novedades, setNovedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novedadAbierta, setNovedadAbierta] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/get_novedades_all.php`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && j?.status === 'ok') setNovedades(j.data ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-cream text-bark flex flex-col">
      <header className="relative bg-sage text-cream shadow-sm z-[9999]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-cream/90 border border-cream/40 hover:border-cream hover:bg-cream/10 px-4 py-2 rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Volver al inicio
          </button>
          <h1 className="font-serif text-lg sm:text-2xl tracking-wide truncate">
            Todas las novedades
          </h1>
          <div className="w-32" />
        </div>
      </header>

      <section className="flex-1 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-6 text-center">
            <span className="inline-block text-xs uppercase tracking-widest text-moss font-semibold mb-2">
              Archivo
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-bark">
              Noticias del Observatorio
            </h2>
            <p className="text-sm text-bark/60 mt-2">
              Toda la comunicación institucional del Parque Industrial.
            </p>
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-sage/20 rounded-2xl overflow-hidden"
                >
                  <div className="aspect-[16/10] bg-sage/10 animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-24 bg-sage/10 rounded animate-pulse" />
                    <div className="h-5 w-3/4 bg-sage/10 rounded animate-pulse" />
                    <div className="h-3 w-full bg-sage/10 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && novedades.length === 0 && (
            <div className="text-center py-16 text-bark/60">
              Todavía no hay novedades publicadas.
            </div>
          )}

          {!loading && novedades.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {novedades.map((n) => (
                <NovedadCard
                  key={n.id}
                  novedad={n}
                  onClickLeer={setNovedadAbierta}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="py-6 text-center text-sm text-bark/60 border-t border-sage/15 mt-auto">
        © Observatorio Industrial · Catamarca
      </footer>

      <NovedadDetalleModal
        novedad={novedadAbierta}
        onClose={() => setNovedadAbierta(null)}
      />
    </div>
  );
}
