import { useEffect, useState } from 'react';
import MapaParque from './MapaParque';
import { cldOptimize } from '../utils/cloudinary';
import { API_URL } from '../utils/apiUrl';

const SITE_CONFIG_CACHE_KEY = 'siteConfigPublic';

const HERO_FALLBACK = [
  {
    imagen_url:
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1920&q=80&auto=format&fit=crop',
    titulo: 'Parque Industrial El Pantanillo',
    subtitulo: 'Una vidriera abierta del desarrollo productivo de Catamarca.',
  },
];

function HeroCarousel({ slides, defaultTitulo, defaultSubtitulo }) {
  const effective =
    Array.isArray(slides) && slides.length > 0 ? slides : HERO_FALLBACK;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (effective.length <= 1) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % effective.length);
    }, 5000);
    return () => clearInterval(id);
  }, [effective.length]);

  const current = effective[Math.min(idx, effective.length - 1)] ?? HERO_FALLBACK[0];
  const titulo = current.titulo || defaultTitulo;
  const subtitulo = current.subtitulo || defaultSubtitulo;

  return (
    <section className="relative overflow-hidden border-b border-sage/15">
      {effective.map((slide, i) => (
        <div
          key={slide.imagen_url || `slide-${i}`}
          aria-hidden={i !== idx}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
            i === idx ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: slide.imagen_url
              ? `url(${cldOptimize(slide.imagen_url, 1920)})`
              : 'linear-gradient(135deg, #4a6741, #7a9171)',
          }}
        />
      ))}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center text-cream">
          <span className="inline-block text-xs uppercase tracking-widest text-cream/80 font-semibold mb-3">
            Parque Industrial El Pantanillo
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl text-cream leading-tight mb-5 drop-shadow">
            {titulo}
          </h2>
          {subtitulo && (
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-cream/90 leading-relaxed drop-shadow">
              {subtitulo}
            </p>
          )}
        </div>
      </div>

      {effective.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {effective.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === idx ? 'bg-cream' : 'bg-cream/40'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

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
        <p className="text-sm text-bark/70 line-clamp-3 mb-4">
          {novedad.contenido}
        </p>
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

export default function LandingPage({ onLoginClick, onVerMasNoticias }) {
  const [lotes, setLotes] = useState([]);
  const [siteConfig, setSiteConfig] = useState(() => {
    // Cache instantáneo desde localStorage para renderizar al toque.
    try {
      const cached = localStorage.getItem(SITE_CONFIG_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loadingLotes, setLoadingLotes] = useState(true);
  const [novedades, setNovedades] = useState([]);
  const [novedadAbierta, setNovedadAbierta] = useState(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`${API_URL}/get_public_lotes.php`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`${API_URL}/get_public_config.php`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`${API_URL}/get_novedades.php`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([lotesRes, configRes, novedadesRes]) => {
      if (cancelled) return;
      if (lotesRes?.status === 'ok') setLotes(lotesRes.data ?? []);
      if (configRes?.status === 'ok' && configRes.data) {
        setSiteConfig(configRes.data);
        try {
          localStorage.setItem(SITE_CONFIG_CACHE_KEY, JSON.stringify(configRes.data));
        } catch {
          /* quota o privacidad: ignorar */
        }
      }
      if (novedadesRes?.status === 'ok') setNovedades(novedadesRes.data ?? []);
      setLoadingLotes(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const siteName = siteConfig?.nombre_sitio || 'Observatorio Industrial';
  const institucion = siteConfig?.institucion || 'Mrio. de Desarrollo Social';
  const footerText =
    siteConfig?.texto_footer || '© Observatorio Industrial - Catamarca';

  return (
    <div className="min-h-screen bg-cream text-bark flex flex-col">
      <header className="relative bg-sage text-cream shadow-sm z-[9999]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-serif text-lg sm:text-2xl tracking-wide truncate">
              {siteName}
            </h1>
            <p className="text-xs sm:text-sm text-cream/80 italic truncate">
              {institucion}
            </p>
          </div>
          <button
            type="button"
            onClick={onLoginClick}
            className="shrink-0 inline-flex items-center gap-2 text-sm font-medium text-cream border border-cream/40 hover:bg-cream/10 hover:border-cream px-4 py-2 rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Acceso Gestores
          </button>
        </div>
      </header>

      <HeroCarousel
        slides={siteConfig?.banner_slides}
        defaultTitulo="Una vidriera abierta del desarrollo productivo de Catamarca"
        defaultSubtitulo="Explorá los lotes industriales, las empresas radicadas y la disponibilidad para nuevas inversiones. Toda la información, en un mapa interactivo y abierto a la ciudadanía."
      />

      <section className="flex-1 py-10 sm:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h3 className="font-serif text-2xl text-bark">Mapa del Parque</h3>
              <p className="text-sm text-bark/60">
                Hacé clic sobre cualquier lote para ver el detalle.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                Disponible
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                Reservado
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sage" />
                Ocupado
              </span>
            </div>
          </div>

          {loadingLotes ? (
            <div className="w-full bg-white border border-sage/20 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-sage/15 flex items-center justify-between">
                <div className="h-5 w-40 bg-sage/10 rounded animate-pulse" />
                <div className="h-4 w-24 bg-sage/10 rounded animate-pulse" />
              </div>
              <div className="h-[360px] sm:h-[420px] bg-sage/5 animate-pulse" />
            </div>
          ) : (
            <MapaParque lotes={lotes} />
          )}
        </div>
      </section>

      {novedades.length > 0 && (
        <section className="py-10 sm:py-14 bg-cream/60 border-t border-sage/15">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="mb-6 text-center">
              <span className="inline-block text-xs uppercase tracking-widest text-moss font-semibold mb-2">
                Comunicación institucional
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-bark">
                Últimas Novedades
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {novedades.map((n) => (
                <NovedadCard
                  key={n.id}
                  novedad={n}
                  onClickLeer={setNovedadAbierta}
                />
              ))}
            </div>

            {onVerMasNoticias && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={onVerMasNoticias}
                  className="inline-flex items-center gap-1.5 text-sage hover:text-moss text-sm font-medium px-5 py-2.5 rounded-lg border border-sage hover:bg-sage/10 transition-colors"
                >
                  Ver todas las novedades
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      <ContactoSection />

      <footer className="py-6 text-center text-sm text-bark/60 border-t border-sage/15 mt-auto">
        {footerText}
      </footer>

      <NovedadDetalleModal
        novedad={novedadAbierta}
        onClose={() => setNovedadAbierta(null)}
      />
    </div>
  );
}

function ContactoSection() {
  const [form, setForm] = useState({ nombre: '', email: '', empresa: '', mensaje: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  function handleChange(field) {
    return (e) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
      setSuccess('');
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccess('');
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/save_consulta.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json || json.status !== 'ok') {
        setErrorMsg(json?.mensaje || 'No se pudo enviar el mensaje.');
        return;
      }
      setSuccess(json.mensaje || 'Tu mensaje fue enviado. ¡Gracias!');
      setForm({ nombre: '', email: '', empresa: '', mensaje: '' });
    } catch (err) {
      setErrorMsg(err.message || 'Error de red.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="py-10 sm:py-14 bg-white border-t border-sage/15">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-6">
          <span className="inline-block text-xs uppercase tracking-widest text-moss font-semibold mb-2">
            ¿Querés invertir?
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl text-bark">
            Contactanos
          </h3>
          <p className="text-sm text-bark/60 mt-2">
            Dejanos tu mensaje y un gestor del observatorio se va a poner en contacto.
          </p>
        </div>

        {success && (
          <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-2.5 text-sm text-green-800 mb-4 text-center">
            {success}
          </div>
        )}
        {errorMsg && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-800 mb-4 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
              Nombre
            </label>
            <input
              type="text"
              required
              value={form.nombre}
              onChange={handleChange('nombre')}
              className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={handleChange('email')}
              className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
              Empresa <span className="normal-case font-normal text-bark/40">(opcional)</span>
            </label>
            <input
              type="text"
              value={form.empresa}
              onChange={handleChange('empresa')}
              className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
              Mensaje
            </label>
            <textarea
              required
              rows={5}
              value={form.mensaje}
              onChange={handleChange('mensaje')}
              className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors resize-y"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-sage text-cream hover:bg-moss shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {submitting && (
                <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-cream/40 border-t-cream animate-spin" />
              )}
              {submitting ? 'Enviando...' : 'Enviar mensaje'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
