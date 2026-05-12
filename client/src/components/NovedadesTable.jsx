import { useCallback, useEffect, useState } from 'react';
import NovedadesModal from './NovedadesModal';
import { cldOptimize } from '../utils/cloudinary';
import { API_URL } from '../utils/apiUrl';

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

function truncar(texto, max = 70) {
  if (!texto) return '';
  return texto.length > max ? texto.slice(0, max - 1) + '…' : texto;
}

export default function NovedadesTable({ token, onUnauthorized, onDataChange }) {
  const [novedades, setNovedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNovedad, setEditingNovedad] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/get_novedades_admin.php`, {
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
      setNovedades(json.data ?? []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las novedades');
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
    setEditingNovedad(null);
    setIsModalOpen(true);
  }

  function openEditModal(novedad) {
    setEditingNovedad(novedad);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingNovedad(null);
  }

  async function handleDelete(novedad) {
    if (!window.confirm(`¿Eliminar la novedad "${novedad.titulo}"?`)) return;
    setDeletingId(novedad.id);
    try {
      const res = await fetch(`${API_URL}/delete_novedad.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: novedad.id }),
      });
      if (res.status === 401) {
        onUnauthorized?.();
        return;
      }
      const json = await res.json().catch(() => null);
      if (!res.ok || !json || json.status !== 'ok') {
        window.alert(json?.mensaje || 'No se pudo eliminar la novedad');
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
            <h2 className="font-serif text-xl text-bark">Novedades</h2>
            {!loading && !error && (
              <span className="text-xs uppercase tracking-widest text-moss font-semibold">
                {novedades.length} publicadas
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
            Nueva Novedad
          </button>
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
            <p className="font-semibold mb-1">Error al cargar novedades</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && novedades.length === 0 && (
          <div className="px-6 py-10 text-center text-bark/60">
            No hay novedades publicadas todavía.
          </div>
        )}

        {!loading && !error && novedades.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/60 text-bark/70">
                <tr className="text-left">
                  <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs">Imagen</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs">Título</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs">Fecha</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs">Estado</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wide text-xs text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/10">
                {novedades.map((n) => (
                  <tr key={n.id} className="hover:bg-cream/40 transition-colors">
                    <td className="px-6 py-3">
                      {n.imagen_url ? (
                        <img
                          src={cldOptimize(n.imagen_url, 200)}
                          alt={n.titulo}
                          className="w-14 h-10 rounded object-cover border border-sage/20"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-14 h-10 rounded bg-sage/10" />
                      )}
                    </td>
                    <td className="px-6 py-3 text-bark font-medium">
                      <div>{n.titulo ?? '—'}</div>
                      <div className="text-xs text-bark/60 mt-0.5">{truncar(n.contenido)}</div>
                    </td>
                    <td className="px-6 py-3 text-bark/80 whitespace-nowrap">
                      {formatFecha(n.fecha_publicacion)}
                    </td>
                    <td className="px-6 py-3">
                      {n.activo ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium bg-green-100 text-green-800 border-green-300">
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium bg-bark/10 text-bark/70 border-bark/20">
                          Oculta
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal(n)}
                        className="text-sage hover:text-moss text-xs font-medium px-2 py-1 rounded hover:bg-sage/10 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(n)}
                        disabled={deletingId === n.id}
                        className="ml-1 text-red-400 hover:text-red-600 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === n.id ? 'Borrando...' : 'Borrar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NovedadesModal
        open={isModalOpen}
        onClose={closeModal}
        onSaved={handleSaved}
        token={token}
        onUnauthorized={onUnauthorized}
        editingNovedad={editingNovedad}
      />
    </>
  );
}
