import { useEffect, useState } from 'react';
import { API_URL } from '../utils/apiUrl';

const CLOUDINARY_CLOUD_NAME = 'dwazrbs09';
const CLOUDINARY_UPLOAD_PRESET = 'observatorio';

const EMPTY_FORM = {
  empresa_id: '',
  titulo: '',
  descripcion: '',
  archivo_url: '',
  estado: 'Presentado',
};

const ESTADOS_DDJJ = ['Presentado', 'En Revisión', 'Aprobado'];

async function uploadFileToCloudinary(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  // /auto/upload acepta tanto imágenes como PDFs y otros tipos.
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
    { method: 'POST', body: fd },
  );
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.secure_url) {
    throw new Error(json?.error?.message || 'No se pudo subir el archivo.');
  }
  return json.secure_url;
}

export default function DDJJModal({
  open,
  onClose,
  onSaved,
  token,
  onUnauthorized,
  editingDdjj,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const isEditing = Boolean(editingDdjj?.id);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setFile(null);
      setErrorMsg('');
      setSubmitting(false);
      setUploadingFile(false);
      return;
    }
    if (editingDdjj) {
      setForm({
        empresa_id: editingDdjj.empresa_id ? String(editingDdjj.empresa_id) : '',
        titulo: editingDdjj.titulo ?? '',
        descripcion: editingDdjj.descripcion ?? '',
        archivo_url: editingDdjj.archivo_url ?? '',
        estado: editingDdjj.estado ?? 'Presentado',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setFile(null);
    setErrorMsg('');
    setSubmitting(false);
    setUploadingFile(false);

    let cancelled = false;
    fetch(`${API_URL}/get_empresas.php`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (r.status === 401) {
          onUnauthorized?.();
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((j) => {
        if (!cancelled && j?.status === 'ok') {
          setEmpresas(j.data ?? []);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, editingDdjj, token, onUnauthorized]);

  if (!open) return null;

  function handleChange(field) {
    return (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      // En edición, preservar el archivo existente si no hay file nuevo.
      let archivoUrl = isEditing
        ? editingDdjj?.archivo_url ?? ''
        : form.archivo_url?.trim() || '';

      if (file) {
        setUploadingFile(true);
        try {
          archivoUrl = await uploadFileToCloudinary(file);
        } finally {
          setUploadingFile(false);
        }
      }

      if (!archivoUrl) {
        setErrorMsg('Debés adjuntar un archivo (PDF o imagen).');
        return;
      }

      const body = {
        empresa_id: Number(form.empresa_id),
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        archivo_url: archivoUrl,
        estado: form.estado,
      };
      if (isEditing) body.id = editingDdjj.id;

      const res = await fetch(`${API_URL}/save_ddjj.php`, {
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
      setErrorMsg(err.message || 'Error de red.');
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
        className="w-full max-w-lg bg-white border border-sage/20 rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-sage/15 flex items-center justify-between">
          <h3 className="font-serif text-xl text-bark">
            {isEditing ? 'Editar DDJJ' : 'Nueva DDJJ'}
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

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {errorMsg && (
            <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-800">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
              Empresa
            </label>
            <select
              required
              value={form.empresa_id}
              onChange={handleChange('empresa_id')}
              className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
            >
              <option value="">Seleccioná una empresa…</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.razon_social} ({e.cuit})
                </option>
              ))}
            </select>
          </div>

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
              placeholder="Balance 2025"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
              Descripción <span className="normal-case font-normal text-bark/40">(opcional)</span>
            </label>
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={handleChange('descripcion')}
              className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors resize-y"
              placeholder="Notas o detalle de la presentación..."
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
              Estado
            </label>
            <select
              required
              value={form.estado}
              onChange={handleChange('estado')}
              className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
            >
              {ESTADOS_DDJJ.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
              Archivo <span className="normal-case font-normal text-bark/40">(PDF o imagen)</span>
            </label>
            {isEditing && editingDdjj?.archivo_url && !file && (
              <div className="mb-2 text-xs text-bark/60">
                Archivo actual:{' '}
                <a
                  href={editingDdjj.archivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sage hover:text-moss font-medium underline"
                >
                  ver actual
                </a>
                {' '}— subí uno nuevo para reemplazarlo.
              </div>
            )}
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-bark/80 rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-sage file:text-cream file:text-xs file:font-medium hover:file:bg-moss file:cursor-pointer focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
            />
            {file && (
              <p className="mt-1.5 text-xs text-bark/60">
                Archivo: <span className="font-medium text-bark">{file.name}</span>
              </p>
            )}
          </div>

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
              {uploadingFile
                ? 'Subiendo archivo...'
                : submitting
                ? 'Guardando...'
                : isEditing
                ? 'Guardar cambios'
                : 'Guardar DDJJ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
