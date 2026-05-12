import { useEffect, useState } from 'react';
import LoteMapModal from './LoteMapModal';
import { API_URL } from '../utils/apiUrl';

function exportToCSV(headers, rows, filename) {
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const s = String(val);
    if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [
    headers.map(escape).join(';'),
    ...rows.map((row) => row.map(escape).join(';')),
  ];
  const csv = '﻿' + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const ESTADOS = ['disponible', 'ocupado', 'reservado'];

const ESTADO_STYLES = {
  disponible: 'bg-green-100 text-green-800 border-green-300',
  reservado: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  ocupado: 'bg-sage/20 text-moss border-sage/40',
  'en obra': 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const EMPTY_FORM = {
  numero_lote: '',
  superficie_m2: '',
  sector: '',
  estado: 'disponible',
  empresa_id: '',
};

function EstadoBadge({ estado }) {
  const key = (estado ?? '').toString().trim().toLowerCase();
  const cls = ESTADO_STYLES[key] ?? 'bg-bark/10 text-bark/70 border-bark/20';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium capitalize ${cls}`}
    >
      {estado ?? '—'}
    </span>
  );
}

function formatSuperficie(value) {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return `${num.toLocaleString('es-AR')} m²`;
}

function LoteModal({ open, onClose, onSaved, editingLote, token, onUnauthorized }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [empresasList, setEmpresasList] = useState([]);
  const isEditing = Boolean(editingLote);

  useEffect(() => {
    let cancelled = false;
    async function fetchEmpresas() {
      try {
        const res = await fetch(`${API_URL}/get_empresas.php`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (cancelled) return;
        if (res.status === 401) {
          onUnauthorized?.();
          return;
        }
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json.status === 'ok') {
          setEmpresasList(json.data ?? []);
        }
      } catch {
        /* ignorar: el form sigue funcionando con la lista vacía */
      }
    }
    fetchEmpresas();
    return () => {
      cancelled = true;
    };
  }, [token, onUnauthorized]);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setErrorMsg('');
      setSubmitting(false);
      return;
    }
    if (editingLote) {
      setForm({
        numero_lote: editingLote.numero_lote ?? '',
        superficie_m2: editingLote.superficie_m2 ?? '',
        sector: editingLote.sector ?? '',
        estado: editingLote.estado ?? 'disponible',
        empresa_id:
          editingLote.empresa_id !== null && editingLote.empresa_id !== undefined
            ? String(editingLote.empresa_id)
            : '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrorMsg('');
    setSubmitting(false);
  }, [open, editingLote]);

  if (!open) return null;

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const url = isEditing
        ? `${API_URL}/update_lote.php`
        : `${API_URL}/save_lote.php`;

      const body = {
        numero_lote: form.numero_lote.trim(),
        superficie_m2: Number(form.superficie_m2),
        sector: form.sector.trim(),
        estado: form.estado,
        empresa_id: form.empresa_id === '' ? null : Number(form.empresa_id),
      };
      if (isEditing) body.id = editingLote.id;

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
            {isEditing ? 'Editar Lote' : 'Nuevo lote'}
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
                Número de lote
              </label>
              <input
                type="text"
                required
                value={form.numero_lote}
                onChange={handleChange('numero_lote')}
                className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
                placeholder="L-001"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
                Superficie (m²)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.superficie_m2}
                onChange={handleChange('superficie_m2')}
                className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
                placeholder="1500"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
                Sector
              </label>
              <input
                type="text"
                required
                value={form.sector}
                onChange={handleChange('sector')}
                className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
                placeholder="A"
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
                className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors capitalize"
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e} className="capitalize">
                    {e}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
                Empresa <span className="normal-case font-normal text-bark/40">(opcional)</span>
              </label>
              <select
                value={form.empresa_id}
                onChange={handleChange('empresa_id')}
                className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
              >
                <option value="">Sin asignar</option>
                {empresasList.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.razon_social}
                  </option>
                ))}
              </select>
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
              {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar lote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LotesTable({
  lotes = [],
  loading = false,
  error = null,
  refetch,
  token,
  onUnauthorized,
  onDataChange,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLote, setEditingLote] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [mapLote, setMapLote] = useState(null);

  async function handleSaved() {
    await refetch?.();
    onDataChange?.();
  }

  function handleExportCSV() {
    const headers = ['Código', 'Sector', 'Superficie m2', 'Estado', 'Propietario'];
    const rows = lotes.map((l) => [
      l.numero_lote ?? '',
      l.sector ?? '',
      l.superficie_m2 ?? '',
      l.estado ?? '',
      l.propietario_nombre ?? '',
    ]);
    const fecha = new Date().toISOString().slice(0, 10);
    exportToCSV(headers, rows, `lotes_${fecha}.csv`);
  }

  function openCreateModal() {
    setEditingLote(null);
    setIsModalOpen(true);
  }

  function openEditModal(lote) {
    setEditingLote(lote);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingLote(null);
  }

  async function handleDelete(lote) {
    if (!window.confirm('¿Seguro que deseas eliminar este lote?')) return;
    setDeletingId(lote.id);
    try {
      const res = await fetch(`${API_URL}/delete_lote.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: lote.id }),
      });
      if (res.status === 401) {
        onUnauthorized?.();
        return;
      }
      const json = await res.json().catch(() => null);
      if (!res.ok || !json || json.status !== 'ok') {
        window.alert(json?.mensaje || 'No se pudo eliminar el lote');
        return;
      }
      await refetch?.();
      onDataChange?.();
    } catch (err) {
      window.alert(err.message || 'No se pudo conectar con el servidor');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="w-full max-w-5xl mx-auto bg-white border border-sage/20 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-sage/15 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h2 className="font-serif text-xl text-bark">Lotes del parque</h2>
            {!loading && !error && (
              <span className="text-xs uppercase tracking-widest text-moss font-semibold">
                {lotes.length} registros
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={!lotes || lotes.length === 0}
              className="text-sage border border-sage hover:bg-sage/10 px-4 py-2 rounded-lg font-medium text-sm transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Exportar Lotes
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 bg-sage text-cream text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-moss transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nuevo Lote
            </button>
          </div>
        </div>

        {loading && (
          <div className="px-6 py-4 space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-sage/5 rounded animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="m-6 bg-red-50 border border-red-300 text-red-800 rounded-xl px-5 py-4">
            <p className="font-semibold mb-1">Error al cargar lotes</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && lotes.length === 0 && (
          <div className="px-6 py-10 text-center text-bark/60">
            No hay lotes registrados todavía.
          </div>
        )}

        {!loading && !error && lotes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/60 text-bark/70">
                <tr className="text-left">
                  <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs">Código</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs">Sector</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs">Superficie</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs">Estado</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs">Propietario</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/10">
                {lotes.map((lote, idx) => (
                  <tr
                    key={lote.id ?? lote.numero_lote ?? idx}
                    className="hover:bg-cream/40 transition-colors"
                  >
                    <td className="px-6 py-3 text-bark font-medium">{lote.numero_lote ?? '—'}</td>
                    <td className="px-6 py-3 text-bark/80">{lote.sector ?? '—'}</td>
                    <td className="px-6 py-3 text-bark/80 font-mono">
                      {formatSuperficie(lote.superficie_m2)}
                    </td>
                    <td className="px-6 py-3">
                      <EstadoBadge estado={lote.estado} />
                    </td>
                    <td className="px-6 py-3 text-bark/80">
                      {lote.propietario_nombre && lote.propietario_nombre.trim() !== ''
                        ? lote.propietario_nombre
                        : '—'}
                    </td>
                    <td className="px-6 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setMapLote(lote)}
                        className="text-teal-600 hover:text-teal-700 text-xs font-medium px-2 py-1 rounded hover:bg-teal-50 transition-colors"
                      >
                        Ubicar
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(lote)}
                        className="ml-1 text-sage hover:text-moss text-xs font-medium px-2 py-1 rounded hover:bg-sage/10 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(lote)}
                        disabled={deletingId === lote.id}
                        className="ml-1 text-red-500/80 hover:text-red-600 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === lote.id ? 'Borrando...' : 'Borrar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LoteModal
        open={isModalOpen}
        onClose={closeModal}
        onSaved={handleSaved}
        editingLote={editingLote}
        token={token}
        onUnauthorized={onUnauthorized}
      />

      <LoteMapModal
        open={Boolean(mapLote)}
        lote={mapLote}
        lotes={lotes}
        onClose={() => setMapLote(null)}
        onSaved={handleSaved}
        token={token}
        onUnauthorized={onUnauthorized}
      />
    </>
  );
}
