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

export default function MapaParque({ lotes = [] }) {
  return (
    <div className="w-full max-w-5xl mx-auto bg-white border border-sage/20 rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-sage/15 flex items-baseline justify-between">
        <h2 className="font-serif text-xl text-bark">Parque Industrial</h2>
        <span className="text-xs uppercase tracking-widest text-moss font-semibold">
          Catamarca
        </span>
      </div>

      <div className="h-[360px] sm:h-[420px] w-full">
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
            const colors = ESTADO_COLORS[estadoKey] ?? DEFAULT_COLOR;

            return (
              <Polygon
                key={lote.id ?? lote.numero_lote}
                positions={positions}
                pathOptions={{
                  color: colors.color,
                  fillColor: colors.fillColor,
                  fillOpacity: 0.45,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="font-bold">{lote.numero_lote ?? '—'}</div>
                  <PopupEstado estado={estadoKey} propietario={lote.propietario_nombre} />
                </Popup>
              </Polygon>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
