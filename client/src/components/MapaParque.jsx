import { useState } from 'react';
import { CircleMarker, LayersControl, MapContainer, Polygon, Popup, TileLayer } from 'react-leaflet';

const PARQUE_CENTER = [-28.535758, -65.801931];

const PARQUE_BOUNDS = [
  [-28.5800, -65.8500], // Esquina Suroeste (ampliada)
  [-28.4900, -65.7500], // Esquina Noreste (ampliada)
];

const ESTADO_COLORS = {
  disponible: { color: '#15803d', fillColor: '#22c55e' },
  ocupado:    { color: '#4a6741', fillColor: '#7a9171' },
  reservado:  { color: '#a16207', fillColor: '#eab308' },
};

const DEFAULT_COLOR = { color: '#6b6b6b', fillColor: '#9ca3af' };

// Estilos del modo inversor.
const LIBRE_STYLE   = { color: '#15803d', fillColor: '#22c55e', fillOpacity: 0.75, weight: 3 };
const OCUPADO_DIM   = { color: '#6b7280', fillColor: '#9ca3af', fillOpacity: 0.15, weight: 1 };

function formatSuperficie(value) {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return `${num.toLocaleString('es-AR')} m²`;
}

function PopupEstado({ estado, propietario }) {
  const owner = typeof propietario === 'string' ? propietario.trim() : '';

  if (estado === 'disponible') {
    return <span className="font-bold text-green-700">DISPONIBLE</span>;
  }

  if (estado === 'reservado') {
    if (owner === '') {
      return <span className="font-bold text-yellow-600">RESERVADO</span>;
    }
    return (
      <div className="text-xs text-bark/80">
        Reservado para: <span className="font-medium">{owner}</span>
      </div>
    );
  }

  if (estado === 'ocupado') {
    if (owner === '') {
      return (
        <div className="text-xs text-bark/70 italic">
          Ocupado (Propietario no registrado)
        </div>
      );
    }
    return <div className="text-xs text-bark/80 font-medium">{owner}</div>;
  }

  return null;
}

function PopupLoteLibre({ lote, onSolicitar }) {
  return (
    <div className="min-w-[200px]">
      <p className="font-bold text-green-700 mb-1">Lote disponible</p>
      <p className="text-sm font-medium text-bark">
        {lote.numero_lote ?? `Lote #${lote.id}`}
      </p>
      <div className="mt-1 text-xs text-bark/70 space-y-0.5">
        {lote.sector && <div>Sector: <span className="font-medium text-bark">{lote.sector}</span></div>}
        <div>Superficie: <span className="font-medium text-bark">{formatSuperficie(lote.superficie_m2)}</span></div>
      </div>
      {onSolicitar && (
        <button
          type="button"
          onClick={() => onSolicitar(lote)}
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 bg-sage text-cream text-xs font-medium px-3 py-1.5 rounded-md hover:bg-moss transition-colors"
        >
          Solicitar Radicación
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function parsePolygonPositions(geo) {
  if (geo === null || geo === undefined) return null;

  let g = geo;
  if (typeof g === 'string') {
    try {
      g = JSON.parse(g);
    } catch {
      return null;
    }
  }

  // GeoJSON: { type: 'Polygon', coordinates: [[[lng, lat], ...]] }
  if (g && g.type === 'Polygon' && Array.isArray(g.coordinates)) {
    return g.coordinates.map((ring) => ring.map(([lng, lat]) => [lat, lng]));
  }
  if (g && g.type === 'MultiPolygon' && Array.isArray(g.coordinates)) {
    return g.coordinates.map((poly) =>
      poly.map((ring) => ring.map(([lng, lat]) => [lat, lng])),
    );
  }

  // Array plano de pares (asumimos convención GeoJSON [lng, lat])
  if (Array.isArray(g) && g.length > 0 && Array.isArray(g[0]) && g[0].length === 2) {
    return g.map(([lng, lat]) => [lat, lng]);
  }

  return null;
}

function esLoteLibre(lote) {
  // Un lote es "libre" si no tiene empresa_id asignada (todavía).
  // Aplicaciones: empresa_id null/undefined o 0.
  const id = lote?.empresa_id;
  if (id === null || id === undefined) return true;
  const n = Number(id);
  return Number.isNaN(n) || n <= 0;
}

export default function MapaParque({ lotes = [], onSolicitarRadicacion }) {
  const [modoInversor, setModoInversor] = useState(false);
  const totalLibres = lotes.filter(esLoteLibre).length;

  return (
    <div className="w-full max-w-5xl mx-auto bg-white border border-sage/20 rounded-2xl shadow-sm overflow-hidden mb-6 relative z-0">
      <div className="px-6 py-4 border-b border-sage/15 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-serif text-xl text-bark">Parque Industrial</h2>
          <p className="text-[11px] uppercase tracking-widest text-moss font-semibold">
            Catamarca
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModoInversor((v) => !v)}
          className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
            modoInversor
              ? 'bg-green-600 text-white border-green-700 hover:bg-green-700'
              : 'bg-white text-sage border-sage/40 hover:bg-sage/10'
          }`}
          title="Resaltar lotes disponibles para inversión"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          {modoInversor ? `Modo inversor activo · ${totalLibres} libres` : 'Ver Lotes Disponibles'}
        </button>
      </div>

      <div
        className="h-[360px] sm:h-[420px] w-full relative z-0 isolate"
        style={{ zIndex: 0, position: 'relative' }}
      >
        <MapContainer
          center={PARQUE_CENTER}
          zoom={14}
          minZoom={13}
          maxBounds={PARQUE_BOUNDS}
          maxBoundsViscosity={1.0}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Satelital">
              <TileLayer
                attribution="Tiles &copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                updateWhenIdle={true}
                keepBuffer={2}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Mapa Base">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                updateWhenIdle={true}
                keepBuffer={2}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          <CircleMarker
            center={PARQUE_CENTER}
            radius={7}
            pathOptions={{
              color: '#4a6741',
              fillColor: '#7a9171',
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup>
              <div className="font-medium">Parque Industrial</div>
              <div className="text-xs text-bark/70">Catamarca</div>
            </Popup>
          </CircleMarker>

          {lotes.map((lote) => {
            const positions = parsePolygonPositions(lote.geometria_terreno);
            if (!positions) return null;

            const estadoKey = (lote.estado ?? '').toString().trim().toLowerCase();
            const libre = esLoteLibre(lote);

            // Estilo: depende del modo activo.
            let pathOptions;
            if (modoInversor) {
              pathOptions = libre ? LIBRE_STYLE : OCUPADO_DIM;
            } else {
              const colors = ESTADO_COLORS[estadoKey] ?? DEFAULT_COLOR;
              pathOptions = {
                color: colors.color,
                fillColor: colors.fillColor,
                fillOpacity: 0.45,
                weight: 2,
              };
            }

            return (
              <Polygon
                key={lote.id ?? lote.numero_lote}
                positions={positions}
                pathOptions={pathOptions}
              >
                <Popup>
                  {modoInversor && libre ? (
                    <PopupLoteLibre lote={lote} onSolicitar={onSolicitarRadicacion} />
                  ) : (
                    <>
                      <div className="font-bold">{lote.numero_lote ?? '—'}</div>
                      <PopupEstado estado={estadoKey} propietario={lote.propietario_nombre} />
                    </>
                  )}
                </Popup>
              </Polygon>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
