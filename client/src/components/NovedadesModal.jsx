import { useEffect, useState } from 'react';
import { cldOptimize } from '../utils/cloudinary';
import { API_URL } from '../utils/apiUrl';

const CLOUDINARY_CLOUD_NAME = 'dwazrbs09';
const CLOUDINARY_UPLOAD_PRESET = 'observatorio';

const EMPTY_FORM = {
  titulo: '',
  contenido: '',
  imagen_url: '',
  activo: true,
};

export default function NovedadesModal({
  open,
  onClose,
  onSaved,
  token,
  onUnauthorized,
  editingNovedad,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImagen, setUploadingImagen] = useState(false);
  const [imagenFile, setImagenFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const isEditing = Boolean(editingNovedad?.id);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setImagenFile(null);
      setErrorMsg('');
      setSubmitting(false);
      setUploadingImagen(false);
      return;
    }
    if (editingNovedad) {
      setForm({
        titulo: editingNovedad.titulo ?? '',
        contenido: editingNovedad.contenido ?? '',
        imagen_url: editingNovedad.imagen_url ?? '',
        activo: editingNovedad.activo === undefined ? true : Boolean(editingNovedad.activo),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setImagenFile(null);
    setErrorMsg('');
    setSubmitting(false);
    setUploadingImagen(false);
  }, [open, editingNovedad]);

  if (!open) return null;

  function handleChange(field) {
    return (e) =>
      setForm((prev) => ({
        ...prev,
        [field]: field === 'activo' ? e.target.checked : e.target.value,
      }));
  }

  function handleImagenChange(e) {
    setImagenFile(e.target.files?.[0] ?? null);
  }

  async function uploadToCloudinary(file) {
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

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      let imagenUrl = isEditing
        ? editingNovedad?.imagen_url ?? null
        : form.imagen_url?.trim() || null;

      if (imagenFile) {
        setUploadingImagen(true);
        try {
          imagenUrl = await uploadToCloudinary(imagenFile);
        } finally {
          setUploadingImagen(false);
        }
      }

      const body = {
        titulo: form.titulo.trim(),
        contenido: form.contenido.trim(),
        imagen_url: imagenUrl,
        activo: form.activo,
      };
      if (isEditing) body.id = editingNovedad.id;

      const res = await fetch(`${API_URL}/save_novedad.php`, {
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
        setErrorMsg(json?.mensaje || `Error al guardar (HTTP ${res.status})`);
        return;
      }

      onSaved?.();
      onClose?.();
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo conectar con el servidor');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white border border-sage/20 rounded-2xl shadow-xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-sage/15 flex items-center justify-between">
          <h3 className="font-serif text-xl text-bark">
            {isEditing ? 'Editar novedad' : 'Nueva novedad'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-bark/50 hover:text-bark transition-colors w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-cream/60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-800">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
              Título
            </label>
            <input
              type="text"
              required
              value={form.titulo}
              onChange={handleChange('titulo')}
              className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
              placeholder="Nuevo polo industrial en El Pantanillo"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
              Contenido
            </label>
            <textarea
              required
              rows={6}
              value={form.contenido}
              onChange={handleChange('contenido')}
              className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors resize-y"
              placeholder="Detalle de la noticia..."
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
              Imagen <span className="normal-case font-normal text-bark/40">(opcional)</span>
            </label>
            {isEditing && editingNovedad?.imagen_url && !imagenFile && (
              <div className="mb-2 flex items-center gap-3">
                <img
                  src={cldOptimize(editingNovedad.imagen_url, 400)}
                  alt="Imagen actual"
                  className="w-16 h-16 rounded-lg object-cover border border-sage/20"
                />
                <span className="text-xs text-bark/60">
                  Imagen actual — subí una nueva para reemplazarla.
                </span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImagenChange}
              className="w-full text-sm text-bark/80 rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-sage file:text-cream file:text-xs file:font-medium hover:file:bg-moss file:cursor-pointer focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
            />
            {imagenFile && (
              <p className="mt-1.5 text-xs text-bark/60">
                Archivo seleccionado: <span className="font-medium text-bark">{imagenFile.name}</span>
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={handleChange('activo')}
              className="w-4 h-4 accent-sage"
            />
            <span className="text-sm text-bark">Publicada (visible en la landing)</span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm text-bark/70 hover:bg-cream/60 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-sage text-cream hover:bg-moss shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {submitting && (
                <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-cream/40 border-t-cream animate-spin" />
              )}
              {uploadingImagen
                ? 'Subiendo imagen...'
                : submitting
                ? 'Guardando...'
                : isEditing
                ? 'Guardar cambios'
                : 'Publicar novedad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
