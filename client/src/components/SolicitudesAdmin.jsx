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

function Campo({ label, children }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-bark/60 font-semibold mb-1">
        {label}
      </p>
      <p className="text-sm text-bark break-words">{children || '—'}</p>
    </div>
  );
}

export default function SolicitudesAdmin({ token, onUnauthorized, onDataChange }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loteAsignado, setLoteAsignado] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [solRes, lotesRes] = await Promise.all([
        fetch(`${API_URL}/get_empresas_admin.php?estado=pendiente`, { headers }).then((r) =>
          r.status === 401 ? Promise.reject(new Error('UNAUTH')) : r.ok ? r.json() : null,
        ),
        fetch(`${API_URL}/get_lotes.php`, { headers })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);
      if (solRes?.status !== 'ok') throw new Error(solRes?.mensaje || 'Respuesta inválida.');
      setSolicitudes(solRes.data ?? []);
      if (lotesRes?.status === 'ok') setLotes(lotesRes.data ?? []);
    } catch (err) {
      if (err.message === 'UNAUTH') {
        onUnauthorized?.();
        return;
      }
      setError(err.message || 'No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  }, [token, onUnauthorized]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const selected = solicitudes.find((s) => s.id === selectedId) || null;

  // Cuando cambia la solicitud seleccionada, precargar el lote actual.
  useEffect(() => {
    setActionMsg('');
    setActionErr('');
    setLoteAsignado(selected?.lote_id ? String(selected.lote_id) : '');
  }, [selectedId, selected?.lote_id]);

  async function ejecutarAccion(estado) {
    if (!selected) return;
    setBusy(true);
    setActionMsg('');
    setActionErr('');
    try {
      const body = {
        id: selected.id,
        estado_verificacion: estado,
      };
      if (estado === 'aprobado' && loteAsignado) {
        body.lote_id = Number(loteAsignado);
      }
      const res = await fetch(`${API_URL}/approve_empresa.php`, {
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
        setActionErr(json?.mensaje || `Error (HTTP ${res.status}).`);
        return;
      }
      setActionMsg(json.mensaje || 'Solicitud procesada.');
      // Sacar la solicitud de la lista local sin recargar todo.
      setSolicitudes((prev) => prev.filter((s) => s.id !== selected.id));
      setSelectedId(null);
      onDataChange?.();
    } catch (err) {
      setActionErr(err.message || 'Error de red.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-bark">Solicitudes pendientes</h2>
          <p className="text-sm text-bark/60">
            Revisá las empresas que se registraron desde el formulario público.
          </p>
        </div>
        {!loading && !error && (
          <span className="text-xs uppercase tracking-widest text-moss font-semibold">
            {solicitudes.length} en cola
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-300 text-red-800 rounded-xl px-5 py-3 text-sm">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Columna izquierda: lista */}
        <aside className="bg-white border border-sage/20 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-sage/15 bg-cream/40">
            <p className="text-xs uppercase tracking-widest text-bark/60 font-semibold">
              Bandeja
            </p>
          </div>
          {loading ? (
            <div className="p-4 space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 bg-sage/5 rounded animate-pulse" />
              ))}
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="p-6 text-center text-sm text-bark/60">
              No hay solicitudes pendientes. ✨
            </div>
          ) : (
            <ul className="divide-y divide-sage/10 max-h-[70vh] overflow-y-auto">
              {solicitudes.map((s) => {
                const isActive = s.id === selectedId;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        isActive ? 'bg-sage/10' : 'hover:bg-cream/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
                        <p className="font-medium text-bark truncate flex-1">
                          {s.nombre_empresa}
                        </p>
                      </div>
                      <p className="text-xs text-bark/60 mt-0.5 truncate">
                        {s.responsable || '—'} · {s.rubro || 'Sin rubro'}
                      </p>
                      <p className="text-[11px] text-bark/50 mt-0.5">
                        {formatFecha(s.fecha_registro)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Columna derecha: detalle + acciones */}
        <section className="bg-white border border-sage/20 rounded-2xl shadow-sm min-h-[400px]">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-bark/50 text-sm py-20">
              Seleccioná una solicitud para ver el detalle.
            </div>
          ) : (
            <div>
              <div className="px-6 py-4 border-b border-sage/15 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest text-moss font-semibold mb-1">
                    Solicitud #{selected.id} · {formatFecha(selected.fecha_registro)}
                  </p>
                  <h3 className="font-serif text-2xl text-bark leading-tight">
                    {selected.nombre_empresa}
                  </h3>
                </div>
                <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium bg-yellow-100 text-yellow-800 border-yellow-300">
                  Pendiente
                </span>
              </div>

              <div className="px-6 py-5 space-y-5">
                {actionMsg && (
                  <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-2.5 text-sm text-green-800">
                    {actionMsg}
                  </div>
                )}
                {actionErr && (
                  <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-800">
                    {actionErr}
                  </div>
                )}

                <section>
                  <p className="text-[11px] uppercase tracking-widest text-bark/60 font-semibold mb-3">
                    Datos generales
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Campo label="Rubro">{selected.rubro}</Campo>
                    <Campo label="Estado operativo">{selected.estado_operativo}</Campo>
                    <Campo label="Responsable">{selected.responsable}</Campo>
                  </div>
                </section>

                <section>
                  <p className="text-[11px] uppercase tracking-widest text-bark/60 font-semibold mb-3">
                    Contacto
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Campo label="Teléfono principal">{selected.contacto_1}</Campo>
                    <Campo label="Teléfono alternativo">{selected.contacto_2}</Campo>
                    <Campo label="Email">
                      {selected.email && (
                        <a
                          href={`mailto:${selected.email}`}
                          className="text-sage hover:text-moss underline-offset-2 hover:underline break-all"
                        >
                          {selected.email}
                        </a>
                      )}
                    </Campo>
                  </div>
                </section>

                <section>
                  <p className="text-[11px] uppercase tracking-widest text-bark/60 font-semibold mb-3">
                    Ubicación
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Campo label="Dirección">{selected.direccion}</Campo>
                    <Campo label="Manzana">{selected.manzana}</Campo>
                  </div>
                </section>

                <section className="border-t border-sage/15 pt-5">
                  <p className="text-[11px] uppercase tracking-widest text-bark/60 font-semibold mb-3">
                    Asignación de lote
                  </p>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[220px]">
                      <label className="block text-xs text-bark/70 mb-1.5">
                        Lote a asignar <span className="text-bark/40">(opcional)</span>
                      </label>
                      <select
                        value={loteAsignado}
                        onChange={(e) => setLoteAsignado(e.target.value)}
                        className="w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-sm text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
                      >
                        <option value="">Sin asignar</option>
                        {lotes.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.numero_lote ?? `Lote #${l.id}`}
                            {l.sector ? ` · Sector ${l.sector}` : ''}
                            {l.estado ? ` · ${l.estado}` : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-bark/50 mt-1">
                        Si la empresa ya tenía un lote, no se sobreescribe automáticamente.
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="px-6 py-4 border-t border-sage/15 flex items-center justify-end gap-2 bg-cream/30">
                <button
                  type="button"
                  onClick={() => ejecutarAccion('rechazado')}
                  disabled={busy}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={() => ejecutarAccion('aprobado')}
                  disabled={busy}
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-sage text-cream hover:bg-moss shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {busy && (
                    <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-cream/40 border-t-cream animate-spin" />
                  )}
                  {busy ? 'Procesando...' : 'Aprobar y publicar'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
