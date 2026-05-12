import { useEffect, useState } from 'react';
import { cldOptimize } from '../utils/cloudinary';
import { API_URL } from '../utils/apiUrl';

const CLOUDINARY_CLOUD_NAME = 'dwazrbs09';
const CLOUDINARY_UPLOAD_PRESET = 'observatorio';

const EMPTY_FORM = {
  cuit: '',
  razon_social: '',
  email_contacto: '',
  actividad_principal: '',
  logo_url: '',
};

export default function EmpresaModal({
  open,
  onClose,
  onSaved,
  token,
  onUnauthorized,
  editingEmpresa,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const isEditing = Boolean(editingEmpresa?.id);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setLogoFile(null);
      setErrorMsg('');
      setSubmitting(false);
      setUploadingLogo(false);
      return;
    }
    if (editingEmpresa) {
      setForm({
        cuit: editingEmpresa.cuit ?? '',
        razon_social: editingEmpresa.razon_social ?? '',
        email_contacto: editingEmpresa.email_contacto ?? '',
        actividad_principal: editingEmpresa.actividad_principal ?? '',
        logo_url: editingEmpresa.logo_url ?? '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setLogoFile(null);
    setErrorMsg('');
    setSubmitting(false);
    setUploadingLogo(false);
  }, [open, editingEmpresa]);

  if (!open) return null;

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);
  }

  async function uploadLogoToCloudinary(file) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: fd },
    );

    const cloudJson = await cloudRes.json().catch(() => null);
    if (!cloudRes.ok || !cloudJson?.secure_url) {
      throw new Error(cloudJson?.error?.message || 'No se pudo subir el logo a Cloudinary.');
    }
    return cloudJson.secure_url;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      // Si es edición y no se eligió archivo nuevo, preservar el logo original.
      let logoUrl = isEditing
        ? editingEmpresa?.logo_url ?? null
        : form.logo_url?.trim() || null;

      if (logoFile) {
        setUploadingLogo(true);
        try {
          logoUrl = await uploadLogoToCloudinary(logoFile);
        } finally {
          setUploadingLogo(false);
        }
      }

      const url = isEditing
        ? `${API_URL}/update_empresa.php`
        : `${API_URL}/save_empresa.php`;

      const body = {
        cuit: form.cuit.trim(),
        razon_social: form.razon_social.trim(),
        email_contacto: form.email_contacto.trim(),
        actividad_principal: form.actividad_principal.trim(),
        logo_url: logoUrl,
      };
      if (isEditing) body.id = editingEmpresa.id;

      const res = await fetch(url, {
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
        className="w-full max-w-lg bg-white border border-sage/20 rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-sage/15 flex items-center justify-between">
          <h3 className="font-serif text-xl text-bark">
            {isEditing ? 'Editar empresa' : 'Nueva empresa'}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
                CUIT
              </label>
              <input
                type="text"
                required
                value={form.cuit}
                onChange={handleChange('cuit')}
                className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
                placeholder="30-12345678-9"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
                Razón social
              </label>
              <input
                type="text"
                required
                value={form.razon_social}
                onChange={handleChange('razon_social')}
                className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
                placeholder="Empresa SA"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
                Email de contacto
              </label>
              <input
                type="email"
                required
                value={form.email_contacto}
                onChange={handleChange('email_contacto')}
                className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
                placeholder="contacto@empresa.com"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
                Actividad principal
              </label>
              <input
                type="text"
                required
                value={form.actividad_principal}
                onChange={handleChange('actividad_principal')}
                className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
                placeholder="Metalúrgica, alimentos, textil..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
                Logo <span className="normal-case font-normal text-bark/40">(opcional)</span>
              </label>
              {isEditing && editingEmpresa?.logo_url && !logoFile && (
                <div className="mb-2 flex items-center gap-3">
                  <img
                    src={cldOptimize(editingEmpresa.logo_url, 200)}
                    alt="Logo actual"
                    className="w-12 h-12 rounded-full object-cover border border-sage/20"
                  />
                  <span className="text-xs text-bark/60">
                    Logo actual — subí un archivo nuevo para reemplazarlo.
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="w-full text-sm text-bark/80 rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-sage file:text-cream file:text-xs file:font-medium hover:file:bg-moss file:cursor-pointer focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
              />
              {logoFile && (
                <p className="mt-1.5 text-xs text-bark/60">
                  Archivo seleccionado: <span className="font-medium text-bark">{logoFile.name}</span>
                </p>
              )}
            </div>
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
              {uploadingLogo
                ? 'Subiendo logo...'
                : submitting
                ? 'Guardando...'
                : isEditing
                ? 'Guardar cambios'
                : 'Guardar empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
