import { useCallback, useEffect, useState } from 'react';
import EmpresaModal from './EmpresaModal';
import EmpresaPerfilModal from './EmpresaPerfilModal';
import { cldOptimize } from '../utils/cloudinary';
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

function LogoAvatar({ empresa }) {
  if (empresa.logo_url) {
    return (
      <img
        src={cldOptimize(empresa.logo_url, 200)}
        alt={`Logo de ${empresa.razon_social ?? ''}`}
        className="w-10 h-10 rounded-full object-cover border border-sage/20"
        loading="lazy"
      />
    );
  }
  const inicial = (empresa.razon_social ?? '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <div className="w-10 h-10 rounded-full bg-sage/10 text-sage flex items-center justify-center font-bold text-sm">
      {inicial}
    </div>
  );
}

export default function EmpresasTable({ token, onUnauthorized, onDataChange }) {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState(null);
  const [viewingEmpresa, setViewingEmpresa] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/get_empresas.php`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401) {
        onUnauthorized?.();
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (errData?.mensaje) {
          throw new Error(errData.mensaje);
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.status !== 'ok') {
        throw new Error(json.mensaje || 'Respuesta inválida del servidor');
      }
      setEmpresas(json.data ?? []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las empresas');
    } finally {
      setLoading(false);
    }
  }, [token, onUnauthorized]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function handleSaved() {
    await refetch();
    onDataChange?.();
  }

  function openCreateModal() {
    setEditingEmpresa(null);
    setIsModalOpen(true);
  }

  function openEditModal(empresa) {
    setEditingEmpresa(empresa);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingEmpresa(null);
  }

  function handleExportCSV() {
    const headers = ['CUIT', 'Razón Social', 'Email', 'Actividad'];
    const rows = empresas.map((e) => [
      e.cuit ?? '',
      e.razon_social ?? '',
      e.email_contacto ?? '',
      e.actividad_principal ?? '',
    ]);
    const fecha = new Date().toISOString().slice(0, 10);
    exportToCSV(headers, rows, `padron_empresas_${fecha}.csv`);
  }

  async function handleDelete(empresa) {
    if (!window.confirm('¿Estás seguro de eliminar esta empresa?')) return;
    setDeletingId(empresa.id);
    try {
      const res = await fetch(`${API_URL}/delete_empresa.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: empresa.id }),
      });
      if (res.status === 401) {
        onUnauthorized?.();
        return;
      }
      const json = await res.json().catch(() => null);
      if (!res.ok || !json || json.status !== 'ok') {
        window.alert(json?.mensaje || 'No se pudo eliminar la empresa');
        return;
      }
      await refetch();
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
          <h2 className="font-serif text-xl text-bark">Empresas</h2>
          {!loading && !error && (
            <span className="text-xs uppercase tracking-widest text-moss font-semibold">
              {empresas.length} registros
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={empresas.length === 0}
            className="text-sage border border-sage hover:bg-sage/10 px-4 py-2 rounded-lg font-medium text-sm transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar Padrón
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
            Nueva Empresa
          </button>
        </div>
      </div>

      {loading && (
        <div className="px-6 py-4 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-sage/5 rounded animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="m-6 bg-red-50 border border-red-300 text-red-800 rounded-xl px-5 py-4">
          <p className="font-semibold mb-1">Error al cargar empresas</p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && empresas.length === 0 && (
        <div className="px-6 py-10 text-center text-bark/60">
          No hay empresas registradas todavía.
        </div>
      )}

      {!loading && !error && empresas.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream/60 text-bark/70">
              <tr className="text-left">
                <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs">CUIT</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs">Razón social</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs">Email</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs">Actividad</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/10">
              {empresas.map((empresa) => (
                <tr
                  key={empresa.id ?? empresa.cuit}
                  className="hover:bg-cream/40 transition-colors"
                >
                  <td className="px-6 py-3 text-bark font-mono">{empresa.cuit ?? '—'}</td>
                  <td className="px-6 py-3 text-bark font-medium">
                    <div className="flex items-center gap-3">
                      <LogoAvatar empresa={empresa} />
                      <span>{empresa.razon_social ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-bark/80 break-all">{empresa.email_contacto ?? '—'}</td>
                  <td className="px-6 py-3 text-bark/80">{empresa.actividad_principal ?? '—'}</td>
                  <td className="px-6 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setViewingEmpresa(empresa)}
                      className="text-sage hover:text-moss text-xs font-medium px-2 py-1 rounded hover:bg-sage/10 transition-colors inline-flex items-center gap-1"
                      title="Ver ficha"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(empresa)}
                      className="ml-1 text-sage hover:text-moss text-xs font-medium px-2 py-1 rounded hover:bg-sage/10 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(empresa)}
                      disabled={deletingId === empresa.id}
                      className="ml-1 text-red-400 hover:text-red-600 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === empresa.id ? 'Borrando...' : 'Borrar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    <EmpresaModal
      open={isModalOpen}
      onClose={closeModal}
      onSaved={handleSaved}
      token={token}
      onUnauthorized={onUnauthorized}
      editingEmpresa={editingEmpresa}
    />

    <EmpresaPerfilModal
      empresa={viewingEmpresa}
      onClose={() => setViewingEmpresa(null)}
      token={token}
      onUnauthorized={onUnauthorized}
    />
    </>
  );
}
