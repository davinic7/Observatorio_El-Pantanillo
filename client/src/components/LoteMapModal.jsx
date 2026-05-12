import { useEffect, useRef, useState } from 'react';
import { FeatureGroup, LayersControl, MapContainer, Polygon, TileLayer, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet-draw/dist/leaflet.draw.css';
import { parsePolygonPositions } from './MapaParque';
import { API_URL } from '../utils/apiUrl';

L.drawLocal.draw.toolbar.buttons.polygon = 'Dibujar polígono del lote';
L.drawLocal.draw.handlers.polygon.tooltip.start = 'Haz clic en el mapa para empezar a dibujar.';
L.drawLocal.draw.handlers.polygon.tooltip.cont = 'Haz clic para continuar dibujando los límites.';
L.drawLocal.draw.handlers.polygon.tooltip.end = 'Haz clic en el primer punto para cerrar el polígono.';
L.drawLocal.edit.toolbar.actions.save.text = 'Guardar';
L.drawLocal.edit.toolbar.actions.save.title = 'Guardar cambios.';
L.drawLocal.edit.toolbar.actions.cancel.text = 'Cancelar';
L.drawLocal.edit.toolbar.actions.cancel.title = 'Cancelar edición.';
L.drawLocal.edit.toolbar.actions.clearAll.text = 'Limpiar';
L.drawLocal.edit.toolbar.actions.clearAll.title = 'Borrar todos los dibujos.';
L.drawLocal.edit.toolbar.buttons.edit = 'Editar forma del lote';
L.drawLocal.edit.toolbar.buttons.remove = 'Borrar forma del lote';
L.drawLocal.edit.handlers.edit.tooltip.text = 'Arrastra los puntos blancos para modificar la forma.';
L.drawLocal.edit.handlers.remove.tooltip.text = 'Haz clic en el polígono para eliminarlo.';
L.drawLocal.draw.toolbar.actions.title = 'Cancelar dibujo';
L.drawLocal.draw.toolbar.actions.text = 'Cancelar';
L.drawLocal.draw.toolbar.finish.title = 'Finalizar dibujo';
L.drawLocal.draw.toolbar.finish.text = 'Finalizar';
L.drawLocal.draw.toolbar.undo.title = 'Borrar último punto dibujado';
L.drawLocal.draw.toolbar.undo.text = 'Borrar último punto';
L.drawLocal.edit.handlers.edit.tooltip.subtext = 'Haz clic en cancelar para deshacer los cambios.';

const PARQUE_CENTER = [-28.535758, -65.801931];

const PARQUE_BOUNDS = [
  [-28.5800, -65.8500], // Esquina Suroeste (ampliada)
  [-28.4900, -65.7500], // Esquina Noreste (ampliada)
];

function formatArea(value) {
  if (value === null || value === undefined) return '—';
  return `${Number(value).toLocaleString('es-AR', { maximumFractionDigits: 2 })} m²`;
}

function AnalisisEspacial({ declarada, dibujada }) {
  const declaradaNum = Number(declarada);
  const hasDeclarada = declarada !== null && declarada !== undefined && declarada !== '' && !Number.isNaN(declaradaNum) && declaradaNum > 0;
  const hasDibujada = dibujada !== null && dibujada !== undefined;

  let banner = null;
  if (hasDeclarada && hasDibujada) {
    const diffPct = (Math.abs(declaradaNum - dibujada) / declaradaNum) * 100;
    if (diffPct > 15) {
      banner = (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-700 px-3 py-2 text-xs">
          ⚠️ El área dibujada difiere significativamente de la declarada
          ({diffPct.toFixed(1)}%).
        </div>
      );
    } else {
      banner = (
        <div className="rounded-lg border border-sage/30 bg-sage/10 text-sage px-3 py-2 text-xs">
          ✅ Coherencia espacial correcta (diferencia {diffPct.toFixed(1)}%).
        </div>
      );
    }
  } else if (hasDibujada) {
    banner = (
      <div className="rounded-lg border border-bark/15 bg-cream/60 text-bark/70 px-3 py-2 text-xs">
        Área dibujada a modo informativo (todavía no hay superficie declarada).
      </div>
    );
  }

  return (
    <div className="mx-4 mb-2 rounded-xl border border-sage/15 bg-cream/40 px-4 py-3">
      <p className="text-[10px] uppercase tracking-widest text-moss font-semibold mb-2">
        Análisis Espacial
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-bark/60">
            Superficie Declarada (Papel)
          </p>
          <p className="font-mono text-bark text-sm">
            {hasDeclarada ? formatArea(declaradaNum) : '—'}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-bark/60">
            Superficie Dibujada (Mapa)
          </p>
          <p className="font-mono text-bark text-sm">{formatArea(dibujada)}</p>
        </div>
      </div>
      {banner}
    </div>
  );
}

function latLngsToGeoJSON(latLngs) {
  // Para un Polygon simple, getLatLngs() devuelve [[LatLng, LatLng, ...]]
  const ring = (Array.isArray(latLngs[0]) ? latLngs[0] : latLngs).map(
    ({ lat, lng }) => [lng, lat],
  );

  // Cerrar el anillo si no está cerrado
  if (
    ring.length > 0 &&
    (ring[0][0] !== ring[ring.length - 1][0] ||
      ring[0][1] !== ring[ring.length - 1][1])
  ) {
    ring.push([ring[0][0], ring[0][1]]);
  }

  return { type: 'Polygon', coordinates: [ring] };
}

function AutoFitBounds({ geometria }) {
  const map = useMap();
  useEffect(() => {
    if (!geometria) return;
    try {
      const geoJsonData =
        typeof geometria === 'string' ? JSON.parse(geometria) : geometria;
      const layer = L.geoJSON(geoJsonData);
      map.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 18 });
    } catch (e) {
      console.error('Error al centrar el mapa en el lote:', e);
    }
  }, [geometria, map]);
  return null;
}

export default function LoteMapModal({
  open,
  onClose,
  lote,
  lotes = [],
  token,
  onSaved,
  onUnauthorized,
}) {
  const featureGroupRef = useRef(null);
  const [geojson, setGeojson] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [areaDibujada, setAreaDibujada] = useState(null);

  function calcularArea(geoJson) {
    if (!geoJson) {
      setAreaDibujada(null);
      return;
    }
    try {
      const area = turf.area(geoJson);
      setAreaDibujada(Math.round(area * 100) / 100);
    } catch {
      setAreaDibujada(null);
    }
  }

  useEffect(() => {
    if (!open) {
      setGeojson(null);
      setErrorMsg('');
      setSubmitting(false);
      setAreaDibujada(null);
      return;
    }
    // Si el lote ya tiene geometría guardada, calcular el área al abrir.
    if (lote?.geometria_terreno) {
      try {
        const geo =
          typeof lote.geometria_terreno === 'string'
            ? JSON.parse(lote.geometria_terreno)
            : lote.geometria_terreno;
        if (geo && (geo.type === 'Polygon' || geo.type === 'MultiPolygon')) {
          const area = turf.area(geo);
          setAreaDibujada(Math.round(area * 100) / 100);
        }
      } catch {
        /* geometría no parseable: ignorar */
      }
    }
  }, [open, lote]);

  if (!open || !lote) return null;

  function handleCreated(e) {
    // Solo permitimos un polígono activo: removemos los anteriores.
    if (featureGroupRef.current) {
      featureGroupRef.current.eachLayer((layer) => {
        if (layer !== e.layer) {
          featureGroupRef.current.removeLayer(layer);
        }
      });
    }
    const geo = latLngsToGeoJSON(e.layer.getLatLngs());
    setGeojson(geo);
    calcularArea(geo);
  }

  function handleEdited(e) {
    e.layers.eachLayer((layer) => {
      const geo = latLngsToGeoJSON(layer.getLatLngs());
      setGeojson(geo);
      calcularArea(geo);
    });
  }

  function handleDeleted() {
    setGeojson(null);
    setAreaDibujada(null);
  }

  async function handleSave() {
    if (!geojson) {
      setErrorMsg('Dibujá primero un polígono sobre el mapa.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/update_geometria.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: lote.id,
          geometria_terreno: JSON.stringify(geojson),
        }),
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
        className="w-full h-full max-w-6xl max-h-[95vh] bg-white border border-sage/20 rounded-2xl shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-sage/15 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-xl text-bark truncate">
              Ubicar lote {lote.numero_lote ?? ''}
            </h3>
            <p className="text-xs text-bark/60 mt-0.5">
              Dibujá el polígono del terreno sobre el mapa.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-bark/50 hover:text-bark transition-colors w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-cream/60 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {errorMsg && (
          <div role="alert" className="mx-6 mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-800">
            {errorMsg}
          </div>
        )}

        <div className="flex-1 min-h-0 m-4 rounded-xl overflow-hidden border border-sage/15">
          <MapContainer
            center={PARQUE_CENTER}
            zoom={16}
            minZoom={13}
            maxBounds={PARQUE_BOUNDS}
            maxBoundsViscosity={1.0}
            className="h-full w-full"
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Satelital">
                <TileLayer
                  attribution="Tiles &copy; Esri"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={19}
                  updateWhenIdle={true}
                  keepBuffer={2}
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Mapa Base">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                  updateWhenIdle={true}
                  keepBuffer={2}
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            <AutoFitBounds geometria={lote?.geometria_terreno} />

            {lotes
              .filter((l) => l.geometria_terreno && l.id !== lote.id)
              .map((l) => {
                const positions = parsePolygonPositions(l.geometria_terreno);
                if (!positions) return null;
                return (
                  <Polygon
                    key={`restringido-${l.id}`}
                    positions={positions}
                    pathOptions={{
                      color: '#6b7280',
                      weight: 1,
                      fillColor: '#9ca3af',
                      fillOpacity: 0.3,
                      dashArray: '4',
                      interactive: false,
                    }}
                  />
                );
              })}

            <FeatureGroup ref={featureGroupRef}>
              <EditControl
                position="topright"
                onCreated={handleCreated}
                onEdited={handleEdited}
                onDeleted={handleDeleted}
                draw={{
                  polygon: {
                    allowIntersection: false,
                    showArea: true,
                    shapeOptions: { color: '#4a6741', weight: 2 },
                  },
                  polyline: false,
                  rectangle: false,
                  circle: false,
                  circlemarker: false,
                  marker: false,
                }}
              />
            </FeatureGroup>
          </MapContainer>
        </div>

        <AnalisisEspacial
          declarada={lote?.superficie_m2}
          dibujada={areaDibujada}
        />

        <div className="px-6 py-4 border-t border-sage/15 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm text-bark/70 hover:bg-cream/60 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting || !geojson}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-sage text-cream hover:bg-moss shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {submitting && (
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-cream/40 border-t-cream animate-spin" />
            )}
            {submitting ? 'Guardando...' : 'Guardar Geometría'}
          </button>
        </div>
      </div>
    </div>
  );
}
