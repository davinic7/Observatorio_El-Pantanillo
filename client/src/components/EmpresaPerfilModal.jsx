import { useEffect, useState } from 'react';
import { cldOptimize } from '../utils/cloudinary';
import { API_URL } from '../utils/apiUrl';

function formatFecha(value) {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

function LogoGrande({ empresa }) {
  if (empresa.logo_url) {
    return (
      <img
        src={cldOptimize(empresa.logo_url, 300)}
        alt={`Logo de ${empresa.razon_social ?? ''}`}
        className="w-24 h-24 rounded-full object-cover border border-sage/30 shadow-sm bg-white"
      />
    );
  }
  const inicial = (empresa.razon_social ?? '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <div className="w-24 h-24 rounded-full bg-sage/15 text-sage flex items-center justify-center font-bold font-serif text-3xl border border-sage/30">
      {inicial}
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-bark/60 font-semibold mb-1">
        {label}
      </p>
      <p className="text-sm text-bark break-words">{children || '—'}</p>
    </div>
  );
}

export default function EmpresaPerfilModal({
  empresa,
  onClose,
  token,
  onUnauthorized,
}) {
  const [lotes, setLotes] = useState([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [ddjj, setDdjj] = useState([]);
  const [loadingDdjj, setLoadingDdjj] = useState(false);

  useEffect(() => {
    if (!empresa) return;
    let cancelled = false;
    setLoadingLotes(true);
    setLoadingDdjj(true);

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch(`${API_URL}/get_lotes.php`, { headers })
        .then((r) => {
          if (r.status === 401) {
            onUnauthorized?.();
            return null;
          }
          return r.ok ? r.json() : null;
        })
        .catch(() => null),
      fetch(`${API_URL}/get_ddjj.php?empresa_id=${empresa.id}`, { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([lotesRes, ddjjRes]) => {
      if (cancelled) return;
      if (lotesRes?.status === 'ok') setLotes(lotesRes.data ?? []);
      if (ddjjRes?.status === 'ok') setDdjj(ddjjRes.data ?? []);
      setLoadingLotes(false);
      setLoadingDdjj(false);
    });

    return () => {
      cancelled = true;
    };
  }, [empresa, token, onUnauthorized]);

  if (!empresa) return null;

  const lotesVinculados = lotes.filter(
    (l) => Number(l.empresa_id) === Number(empresa.id),
  );
  const fechaRegistro = formatFecha(
    empresa.fecha_registro ?? empresa.created_at ?? null,
  );

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-cream border border-sage/20 rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-6 pt-6 pb-5 border-b border-sage/15 bg-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-4 right-4 text-bark/50 hover:text-bark transition-colors w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-cream/60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="flex items-center gap-5">
            <LogoGrande empresa={empresa} />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-moss font-semibold mb-1">
                Ficha de empresa
              </p>
              <h3 className="font-serif text-2xl text-bark leading-tight break-words">
                {empresa.razon_social ?? '—'}
              </h3>
              <p className="text-sm text-bark/70 font-mono mt-1">
                CUIT: {empresa.cuit ?? '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Actividad Principal">{empresa.actividad_principal}</Campo>
            <Campo label="Email de Contacto">{empresa.email_contacto}</Campo>
            {fechaRegistro && (
              <Campo label="Fecha de Registro">{fechaRegistro}</Campo>
            )}
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-widest text-bark/60 font-semibold mb-2">
              Declaraciones Juradas
            </p>
            {loadingDdjj ? (
              <p className="text-sm text-bark/60 italic">Cargando DDJJ...</p>
            ) : ddjj.length === 0 ? (
              <p className="text-sm text-bark/60 italic">Sin DDJJ presentadas.</p>
            ) : (
              <ul className="divide-y divide-sage/10 border border-sage/15 rounded-lg overflow-hidden">
                {ddjj.map((d) => (
                  <li key={d.id} className="px-3 py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-bark font-medium truncate">{d.titulo}</p>
                      <p className="text-xs text-bark/60">
                        {formatFecha(d.fecha_presentacion)}
                        {d.estado && <span className="ml-2 text-moss">· {d.estado}</span>}
                      </p>
                    </div>
                    {d.archivo_url && (
                      <a
                        href={d.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1 text-xs text-sage hover:text-moss font-medium px-2 py-1 rounded hover:bg-sage/10 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        Ver
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-widest text-bark/60 font-semibold mb-2">
              Lotes Vinculados
            </p>
            {loadingLotes ? (
              <p className="text-sm text-bark/60 italic">Cargando lotes...</p>
            ) : lotesVinculados.length === 0 ? (
              <p className="text-sm text-bark/60 italic">
                Esta empresa no tiene lotes asignados.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {lotesVinculados.map((l) => (
                  <span
                    key={l.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage/15 border border-sage/30 text-sage text-xs font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {l.numero_lote ?? `Lote #${l.id}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-sage/15 flex justify-end bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-bark text-cream hover:bg-bark/80 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
