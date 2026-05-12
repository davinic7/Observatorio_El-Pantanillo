import { useCallback, useEffect, useState } from 'react';
import DDJJModal from './DDJJModal';
import { API_URL } from '../utils/apiUrl';

const ESTADO_STYLES = {
  presentado:    'bg-blue-100 text-blue-800 border-blue-300',
  'en revisión': 'bg-amber-100 text-amber-800 border-amber-300',
  'en revision': 'bg-amber-100 text-amber-800 border-amber-300',
  aprobado:      'bg-emerald-100 text-emerald-800 border-emerald-300',
};

const ESTADOS_DDJJ = ['Presentado', 'En Revisión', 'Aprobado'];

function EstadoBadge({ estado }) {
  if (!estado) return <span className="text-bark/50">—</span>;
  const key = estado.toString().trim().toLowerCase();
  const cls = ESTADO_STYLES[key] ?? 'bg-bark/10 text-bark/70 border-bark/20';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium ${cls}`}
    >
      {estado}
    </span>
  );
}

function formatFecha(value) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

export default function DDJJTable({ token, onUnauthorized, onDataChange }) {
  const [ddjj, setDdjj] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDdjj, setEditingDdjj] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Filtros
  const [filterSearch, setFilterSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/get_ddjj.php`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401) {
        onUnauthorized?.();
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.mensaje || `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.status !== 'ok') throw new Error(json.mensaje || 'Respuesta inválida');
      setDdjj(json.data ?? []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las DDJJ');
    } finally {
      setLoading(false);
    }
  }, [token, onUnauthorized]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Cargar empresas para el selector de filtro (al montar).
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`${API_URL}/get_empresas.php`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && j?.status === 'ok') setEmpresas(j.data ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token]);

  const filtered = ddjj.filter((d) => {
    if (filterEstado && d.estado !== filterEstado) return false;
    if (filterEmpresa && String(d.empresa_id) !== String(filterEmpresa)) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase().trim();
      const hay =
        (d.titulo || '').toLowerCase().includes(q) ||
        (d.razon_social || '').toLowerCase().includes(q) ||
        (d.descripcion || '').toLowerCase().includes(q);
      if (!hay) return false;
    }
    return true;
  });

  const hasFilters = filterSearch !== '' || filterEstado !== '' || filterEmpresa !== '';
  function clearFilters() {
    setFilterSearch('');
    setFilterEstado('');
    setFilterEmpresa('');
  }

  async function handleSaved() {
    await refetch();
    onDataChange?.();
  }

  function openCreateModal() {
    setEditingDdjj(null);
    setIsModalOpen(true);
  }

  function openEditModal(item) {
    setEditingDdjj(item);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingDdjj(null);
  }

  async function handleDelete(item) {
    if (!window.confirm(`¿Eliminar la DDJJ "${item.titulo}"?`)) return;
    setDeletingId(item.id);
    try {
      const res = await fetch(`${API_URL}/delete_ddjj.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: item.id }),
      });
      if (res.status === 401) {
        onUnauthorized?.();
        return;
      }
      const json = await res.json().catch(() => null);
      if (!res.ok || !json || json.status !== 'ok') {
        window.alert(json?.mensaje || 'No se pudo eliminar la DDJJ');
        return;
      }
      await refetch();
      onDataChange?.();
    } catch (err) {
      window.alert(err.message || 'Error de red');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="w-full max-w-5xl mx-auto bg-white border border-sage/20 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-sage/15 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h2 className="font-serif text-xl text-bark">Declaraciones Juradas</h2>
            {!loading && !error && (
              <span className="text-xs uppercase tracking-widest text-moss font-semibold">
                {hasFilters
                  ? `${filtered.length} de ${ddjj.length}`
                  : `${ddjj.length} cargadas`}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 bg-sage text-cream text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-moss transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva DDJJ
          </button>
        </div>

        <div className="px-6 py-3 border-b border-sage/10 bg-cream/30 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[10px] uppercase tracking-widest text-bark/60 font-semibold mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Por título, empresa o descripción..."
              className="w-full rounded-lg border border-sage/30 bg-white px-3 py-1.5 text-sm text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="block text-[10px] uppercase tracking-widest text-bark/60 font-semibold mb-1">
              Estado
            </label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full rounded-lg border border-sage/30 bg-white px-3 py-1.5 text-sm text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
            >
              <option value="">Todos</option>
              {ESTADOS_DDJJ.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px]">
            <label className="block text-[10px] uppercase tracking-widest text-bark/60 font-semibold mb-1">
              Empresa
            </label>
            <select
              value={filterEmpresa}
              onChange={(e) => setFilterEmpresa(e.target.value)}
              className="w-full rounded-lg border border-sage/30 bg-white px-3 py-1.5 text-sm text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
            >
              <option value="">Todas</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.razon_social}
                </option>
              ))}
            </select>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-bark/70 hover:text-moss font-medium px-3 py-1.5 rounded border border-sage/30 hover:bg-sage/10 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {loading && (
          <div className="px-6 py-4 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 bg-sage/5 rounded animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="m-6 bg-red-50 border border-red-300 text-red-800 rounded-xl px-5 py-4">
            <p className="font-semibold mb-1">Error al cargar DDJJ</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && ddjj.length === 0 && (
          <div className="px-6 py-10 text-center text-bark/60">
            Todavía no hay declaraciones juradas cargadas.
          </div>
        )}

        {!loading && !error && ddjj.length > 0 && filtered.length === 0 && (
          <div className="px-6 py-10 text-center text-bark/60">
            No hay resultados para los filtros aplicados.
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/60 text-bark/70">
                <tr className="text-left">
                  <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs">Título</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs">Empresa</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs">Fecha presentación</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs">Estado</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs">Archivo</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/10">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-cream/40 transition-colors">
                    <td className="px-6 py-3 text-bark font-medium">
                      <div>{d.titulo}</div>
                      {d.descripcion && (
                        <div className="text-xs text-bark/60 mt-0.5 line-clamp-1">
                          {d.descripcion}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-bark/80">{d.razon_social ?? '—'}</td>
                    <td className="px-6 py-3 text-bark/80 whitespace-nowrap">
                      {formatFecha(d.fecha_presentacion)}
                    </td>
                    <td className="px-6 py-3">
                      <EstadoBadge estado={d.estado} />
                    </td>
                    <td className="px-6 py-3">
                      {d.archivo_url ? (
                        <a
                          href={d.archivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sage hover:text-moss text-xs font-medium px-2 py-1 rounded hover:bg-sage/10 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          Ver archivo
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal(d)}
                        className="text-sage hover:text-moss text-xs font-medium px-2 py-1 rounded hover:bg-sage/10 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(d)}
                        disabled={deletingId === d.id}
                        className="ml-1 text-red-400 hover:text-red-600 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === d.id ? 'Borrando...' : 'Borrar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DDJJModal
        open={isModalOpen}
        onClose={closeModal}
        onSaved={handleSaved}
        token={token}
        onUnauthorized={onUnauthorized}
        editingDdjj={editingDdjj}
      />
    </>
  );
}
