import { useCallback, useEffect, useState } from 'react';
import { API_URL } from '../utils/apiUrl';

function formatFecha(value) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export default function ConsultasTable({ token, onUnauthorized, onDataChange }) {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/get_consultas.php`, {
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
      setConsultas(json.data ?? []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las consultas');
    } finally {
      setLoading(false);
    }
  }, [token, onUnauthorized]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function toggleLeida(consulta) {
    setBusyId(consulta.id);
    try {
      const res = await fetch(`${API_URL}/mark_consulta_leida.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: consulta.id, leida: !consulta.leida }),
      });
      if (res.status === 401) {
        onUnauthorized?.();
        return;
      }
      await refetch();
      onDataChange?.();
    } catch (err) {
      window.alert(err.message || 'Error de red');
    } finally {
      setBusyId(null);
    }
  }

  const sinLeer = consultas.filter((c) => !c.leida).length;

  return (
    <div className="w-full max-w-5xl mx-auto bg-white border border-sage/20 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-sage/15 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-serif text-xl text-bark">Consultas</h2>
          {!loading && !error && (
            <span className="text-xs uppercase tracking-widest text-moss font-semibold">
              {consultas.length} totales · {sinLeer} sin leer
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div className="px-6 py-10 flex items-center gap-3 text-bark/70">
          <span className="inline-block w-3 h-3 rounded-full bg-sage animate-pulse" />
          <span className="text-sm">Cargando consultas...</span>
        </div>
      )}

      {!loading && error && (
        <div className="m-6 bg-red-50 border border-red-300 text-red-800 rounded-xl px-5 py-4">
          <p className="font-semibold mb-1">Error al cargar consultas</p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && consultas.length === 0 && (
        <div className="px-6 py-10 text-center text-bark/60">
          Todavía no hay consultas recibidas.
        </div>
      )}

      {!loading && !error && consultas.length > 0 && (
        <ul className="divide-y divide-sage/10">
          {consultas.map((c) => {
            const isOpen = expandedId === c.id;
            return (
              <li
                key={c.id}
                className={`px-6 py-4 transition-colors ${
                  c.leida ? 'bg-white' : 'bg-sage/5'
                }`}
              >
                <div
                  className="flex items-center justify-between gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isOpen ? null : c.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      {!c.leida && (
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      )}
                      <p className="font-medium text-bark truncate">{c.nombre}</p>
                      {c.empresa && (
                        <span className="text-xs text-bark/60">· {c.empresa}</span>
                      )}
                    </div>
                    <p className="text-xs text-bark/60 break-all">{c.email}</p>
                    <p className="text-sm text-bark/80 mt-1 line-clamp-1">
                      {c.mensaje}
                    </p>
                  </div>
                  <div className="text-right shrink-0 text-xs text-bark/60 whitespace-nowrap">
                    {formatFecha(c.fecha_envio)}
                  </div>
                </div>
                {isOpen && (
                  <div className="mt-3 ml-4 pl-4 border-l-2 border-sage/30">
                    <p className="whitespace-pre-line text-sm text-bark leading-relaxed">
                      {c.mensaje}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <a
                        href={`mailto:${c.email}`}
                        className="inline-flex items-center gap-1.5 text-xs text-sage hover:text-moss font-medium px-3 py-1.5 rounded border border-sage/30 hover:bg-sage/10 transition-colors"
                      >
                        Responder por email
                      </a>
                      <button
                        type="button"
                        onClick={() => toggleLeida(c)}
                        disabled={busyId === c.id}
                        className="text-xs text-bark/70 hover:text-bark font-medium px-3 py-1.5 rounded hover:bg-cream/60 transition-colors disabled:opacity-50"
                      >
                        {busyId === c.id
                          ? 'Guardando...'
                          : c.leida
                          ? 'Marcar como no leída'
                          : 'Marcar como leída'}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
