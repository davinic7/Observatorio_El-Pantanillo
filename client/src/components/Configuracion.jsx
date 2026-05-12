import { useEffect, useState } from 'react';
import { cldOptimize } from '../utils/cloudinary';
import { API_URL } from '../utils/apiUrl';

const CLOUDINARY_CLOUD_NAME = 'dwazrbs09';
const CLOUDINARY_UPLOAD_PRESET = 'observatorio';

const FIELDS = [
  { key: 'nombre_sitio', label: 'Nombre del Observatorio', placeholder: 'Observatorio Industrial' },
  { key: 'institucion', label: 'Institución / Ministerio', placeholder: 'Mrio. de Desarrollo Social' },
  { key: 'email_contacto', label: 'Email de contacto general', type: 'email', placeholder: 'contacto@observatorio.gob.ar' },
  { key: 'texto_footer', label: 'Texto del footer', textarea: true, placeholder: '© Observatorio Industrial - Catamarca' },
];

const EMPTY_FORM = {
  nombre_sitio: '',
  institucion: '',
  email_contacto: '',
  texto_footer: '',
};

const EMPTY_SLIDE = { titulo: '', subtitulo: '', imagen_url: '' };
const EMPTY_SLIDES = [EMPTY_SLIDE, EMPTY_SLIDE, EMPTY_SLIDE].map((s) => ({ ...s }));

async function uploadImageToCloudinary(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: fd },
  );
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.secure_url) {
    throw new Error(json?.error?.message || 'No se pudo subir la imagen.');
  }
  return json.secure_url;
}

function SlideEditor({ index, slide, file, onChange, onFileChange }) {
  return (
    <div className="rounded-xl border border-sage/20 bg-cream/40 p-4">
      <p className="text-xs uppercase tracking-widest text-moss font-semibold mb-3">
        Slide {index + 1}
      </p>
      <div className="flex items-start gap-4 mb-3">
        {slide.imagen_url ? (
          <img
            src={cldOptimize(slide.imagen_url, 400)}
            alt={`Slide ${index + 1}`}
            className="w-24 h-16 rounded-md object-cover border border-sage/20 shrink-0"
            loading="lazy"
          />
        ) : (
          <div className="w-24 h-16 rounded-md bg-sage/10 border border-sage/20 shrink-0" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          className="flex-1 text-sm text-bark/80 rounded-lg border border-sage/30 bg-white px-3 py-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-sage file:text-cream file:text-xs file:font-medium hover:file:bg-moss file:cursor-pointer focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
        />
      </div>
      {file && (
        <p className="text-xs text-bark/60 mb-2">
          Pendiente: <span className="font-medium text-bark">{file.name}</span>
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          value={slide.titulo}
          onChange={(e) => onChange('titulo', e.target.value)}
          placeholder="Título del slide"
          className="w-full rounded-lg border border-sage/30 bg-white px-3 py-2 text-bark text-sm focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
        />
        <input
          type="text"
          value={slide.subtitulo}
          onChange={(e) => onChange('subtitulo', e.target.value)}
          placeholder="Subtítulo / texto descriptivo"
          className="w-full rounded-lg border border-sage/30 bg-white px-3 py-2 text-bark text-sm focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
        />
      </div>
    </div>
  );
}

export default function Configuracion({ token, onUnauthorized, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [slides, setSlides] = useState(EMPTY_SLIDES);
  const [slideFiles, setSlideFiles] = useState([null, null, null]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSlides, setUploadingSlides] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/get_configuracion.php`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (cancelled) return;
        if (res.status === 401) {
          onUnauthorized?.();
          return;
        }
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.mensaje || `HTTP ${res.status}`);
        }
        const json = await res.json();
        if (json.status !== 'ok') {
          throw new Error(json.mensaje || 'Respuesta inválida del servidor');
        }
        if (!cancelled) {
          const data = json.data || {};
          setForm({ ...EMPTY_FORM, ...data });

          const incoming = Array.isArray(data.banner_slides) ? data.banner_slides : [];
          const normalized = [0, 1, 2].map((i) => ({
            titulo: incoming[i]?.titulo ?? '',
            subtitulo: incoming[i]?.subtitulo ?? '',
            imagen_url: incoming[i]?.imagen_url ?? '',
          }));
          setSlides(normalized);
          setSlideFiles([null, null, null]);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'No se pudo cargar la configuración');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, onUnauthorized]);

  function handleChange(field) {
    return (e) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setSuccessMsg('');
    };
  }

  function handleSlideChange(index, field, value) {
    setSlides((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
    setSuccessMsg('');
  }

  function handleSlideFile(index, file) {
    setSlideFiles((prev) => prev.map((f, i) => (i === index ? file : f)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccessMsg('');
    setSaving(true);

    try {
      // Subir nuevas imágenes de slides en paralelo.
      const pendingUploads = slideFiles.map((file, i) =>
        file ? uploadImageToCloudinary(file).then((url) => ({ i, url })) : null,
      );
      const uploadJobs = pendingUploads.filter(Boolean);

      let finalSlides = slides;
      if (uploadJobs.length > 0) {
        setUploadingSlides(true);
        try {
          const results = await Promise.all(uploadJobs);
          finalSlides = slides.map((s, i) => {
            const upd = results.find((r) => r.i === i);
            return upd ? { ...s, imagen_url: upd.url } : s;
          });
          setSlides(finalSlides);
        } finally {
          setUploadingSlides(false);
        }
      }

      const banner_slides = finalSlides.filter(
        (s) =>
          (s.titulo && s.titulo.trim() !== '') ||
          (s.subtitulo && s.subtitulo.trim() !== '') ||
          (s.imagen_url && s.imagen_url.trim() !== ''),
      );

      const body = { ...form, banner_slides };

      const res = await fetch(`${API_URL}/update_configuracion.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        onUnauthorized?.();
        return;
      }
      const json = await res.json().catch(() => null);
      if (!res.ok || !json || json.status !== 'ok') {
        setError(json?.mensaje || `Error al guardar (HTTP ${res.status})`);
        return;
      }

      setSuccessMsg('Configuración guardada exitosamente.');
      setSlideFiles([null, null, null]);
      onSaved?.(body);
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servidor');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-sage/20 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-sage/15">
        <h2 className="font-serif text-xl text-bark">Configuración del sitio</h2>
        <p className="text-xs text-bark/60 mt-1">
          Ajustá los datos generales del observatorio.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
        {loading && (
          <div className="flex items-center gap-3 text-bark/70 py-4">
            <span className="inline-block w-3 h-3 rounded-full bg-sage animate-pulse" />
            <span className="text-sm">Cargando configuración...</span>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-800">
            {error}
          </div>
        )}

        {successMsg && !error && (
          <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-2.5 text-sm text-green-800">
            {successMsg}
          </div>
        )}

        {!loading && (
          <>
            <div className="space-y-4">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
                    {f.label}
                  </label>
                  {f.textarea ? (
                    <textarea
                      rows={3}
                      value={form[f.key] || ''}
                      onChange={handleChange(f.key)}
                      placeholder={f.placeholder}
                      className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors resize-y"
                    />
                  ) : (
                    <input
                      type={f.type || 'text'}
                      value={form[f.key] || ''}
                      onChange={handleChange(f.key)}
                      placeholder={f.placeholder}
                      className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="pt-5 border-t border-sage/15">
              <div className="mb-4">
                <h3 className="font-serif text-lg text-bark">Gestión de Banner Principal</h3>
                <p className="text-xs text-bark/60 mt-1">
                  Hasta 3 slides para el carrusel de la página pública. Subí una imagen y opcionalmente título/subtítulo.
                </p>
              </div>
              <div className="space-y-3">
                {slides.map((s, i) => (
                  <SlideEditor
                    key={i}
                    index={i}
                    slide={s}
                    file={slideFiles[i]}
                    onChange={(field, value) => handleSlideChange(i, field, value)}
                    onFileChange={(file) => handleSlideFile(i, file)}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-sage text-cream hover:bg-moss shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {saving && (
                  <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-cream/40 border-t-cream animate-spin" />
                )}
                {uploadingSlides
                  ? 'Subiendo imágenes...'
                  : saving
                  ? 'Guardando...'
                  : 'Guardar configuración'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
