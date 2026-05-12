import { useEffect, useState } from 'react';
import { API_URL } from '../utils/apiUrl';

function MetricCard({ title, value, accent, loading }) {
  return (
    <div className={`bg-white border border-sage/20 rounded-2xl shadow-sm p-5 border-l-4 ${accent}`}>
      <p className="text-xs uppercase tracking-widest text-bark/60 font-semibold">{title}</p>
      <p className="mt-2 font-serif text-3xl text-bark tabular-nums">
        {loading ? (
          <span className="inline-block w-12 h-6 bg-cream/80 rounded animate-pulse align-middle" />
        ) : (
          value ?? 0
        )}
      </p>
    </div>
  );
}

function DonutOcupacion({ disponibles = 0, ocupados = 0, reservados = 0 }) {
  const total = disponibles + ocupados + reservados;
  // Radio y circunferencia
  const r = 60;
  const c = 2 * Math.PI * r;

  const slices = total === 0
    ? [{ label: 'Sin datos', color: '#d1d5db', value: 1, pct: 1 }]
    : [
        { label: 'Disponibles', color: '#22c55e', value: disponibles, pct: disponibles / total },
        { label: 'Ocupados',    color: '#7a9171', value: ocupados,    pct: ocupados / total },
        { label: 'Reservados',  color: '#eab308', value: reservados,  pct: reservados / total },
      ];

  let offset = 0;

  return (
    <div className="bg-white border border-sage/20 rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row items-center gap-5">
      <div className="relative shrink-0">
        <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
          <circle cx="80" cy="80" r={r} fill="none" stroke="#f5f1ea" strokeWidth="20" />
          {slices.map((s, idx) => {
            const dash = s.pct * c;
            const segment = (
              <circle
                key={idx}
                cx="80"
                cy="80"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="20"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return segment;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs uppercase tracking-widest text-bark/60 font-semibold">Total</p>
          <p className="font-serif text-2xl text-bark">{total}</p>
        </div>
      </div>
      <div className="flex-1 w-full">
        <p className="text-xs uppercase tracking-widest text-moss font-semibold mb-3">
          Ocupación del Parque
        </p>
        <ul className="space-y-2">
          {[
            { label: 'Disponibles', value: disponibles, color: '#22c55e' },
            { label: 'Ocupados',    value: ocupados,    color: '#7a9171' },
            { label: 'Reservados',  value: reservados,  color: '#eab308' },
          ].map((row) => (
            <li key={row.label} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-bark/80">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                {row.label}
              </span>
              <span className="font-mono text-bark">
                {row.value} {total > 0 && (
                  <span className="text-bark/50 text-xs">
                    ({((row.value / total) * 100).toFixed(0)}%)
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function MetricasDashboard({ token, onUnauthorized, refreshTrigger }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/get_stats.php`, {
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
        if (json.status !== 'ok') throw new Error(json.mensaje || 'Respuesta inválida');
        if (!cancelled) setStats(json.data ?? null);
      } catch (err) {
        if (!cancelled) setError(err.message || 'No se pudieron cargar las métricas');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, [token, onUnauthorized, refreshTrigger]);

  const totalEmpresas    = stats?.total_empresas ?? 0;
  const porEstado        = stats?.lotes_por_estado ?? {};
  const disponibles      = porEstado.disponible ?? 0;
  const ocupados         = porEstado.ocupado ?? 0;
  const reservados       = porEstado.reservado ?? 0;
  const novedadesActivas = stats?.novedades_activas ?? 0;
  const consultasSinLeer = stats?.consultas_sin_leer ?? 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 rounded-xl px-5 py-3 text-sm">
          <span className="font-semibold">Error al cargar métricas:</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Empresas Radicadas" value={totalEmpresas}    accent="border-l-moss"        loading={loading} />
        <MetricCard title="Lotes Disponibles"  value={disponibles}      accent="border-l-teal-500"    loading={loading} />
        <MetricCard title="Lotes Ocupados"     value={ocupados}         accent="border-l-sage"        loading={loading} />
        <MetricCard title="Lotes Reservados"   value={reservados}       accent="border-l-yellow-500"  loading={loading} />
        <MetricCard title="Novedades Activas"  value={novedadesActivas} accent="border-l-indigo-500"  loading={loading} />
        <MetricCard title="Consultas sin leer" value={consultasSinLeer} accent="border-l-red-500"     loading={loading} />
      </div>

      {!loading && <DonutOcupacion disponibles={disponibles} ocupados={ocupados} reservados={reservados} />}
    </div>
  );
}
