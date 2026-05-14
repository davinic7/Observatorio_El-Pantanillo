import { useEffect, useState } from 'react';
import { API_URL } from '../utils/apiUrl';

const PASOS = [
  { id: 1, label: 'Datos Generales' },
  { id: 2, label: 'Contacto' },
  { id: 3, label: 'Ubicación' },
];

const EMPTY_FORM = {
  nombre_empresa: '',
  rubro: '',
  estado_operativo: 'ACTIVA',
  responsable: '',
  contacto_1: '',
  contacto_2: '',
  email: '',
  direccion: '',
  manzana: '',
};

function StepIndicator({ paso }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {PASOS.map((p, i) => {
        const isActive = p.id === paso;
        const isDone = p.id < paso;
        return (
          <div key={p.id} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-colors ${
                  isDone
                    ? 'bg-sage border-sage text-cream'
                    : isActive
                    ? 'bg-cream border-sage text-sage'
                    : 'bg-white border-sage/30 text-bark/40'
                }`}
              >
                {isDone ? '✓' : p.id}
              </div>
              <span
                className={`mt-1 text-[10px] uppercase tracking-widest font-semibold ${
                  isActive ? 'text-moss' : 'text-bark/50'
                }`}
              >
                {p.label}
              </span>
            </div>
            {i < PASOS.length - 1 && (
              <span
                className={`w-10 h-0.5 rounded ${
                  p.id < paso ? 'bg-sage' : 'bg-sage/20'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Campo({ label, optional = false, children }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-bark/70 mb-1.5 font-semibold">
        {label}
        {optional && (
          <span className="normal-case font-normal text-bark/40"> (opcional)</span>
        )}
      </label>
      {children}
    </div>
  );
}

const INPUT_CLS =
  'w-full rounded-lg border border-sage/30 bg-cream/40 px-3 py-2 text-bark focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors';

function formatSuperficie(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return `${num.toLocaleString('es-AR')} m²`;
}

export default function RegistroEmpresa({
  onBack,
  onLoginClick,
  onCompleted,
  lotePreseleccionado,
}) {
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Precarga la manzana con el sector del lote elegido en el mapa.
  // Solo lo hace si el usuario todavía no escribió nada manualmente.
  useEffect(() => {
    const sector = lotePreseleccionado?.sector;
    if (!sector) return;
    setForm((prev) =>
      prev.manzana && prev.manzana.trim() !== ''
        ? prev
        : { ...prev, manzana: String(sector) },
    );
  }, [lotePreseleccionado]);

  function update(field) {
    return (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  function validarPaso() {
    if (paso === 1) {
      if (!form.nombre_empresa.trim()) return 'El nombre de la empresa es obligatorio.';
      if (!form.responsable.trim()) return 'Indicá el responsable.';
    }
    if (paso === 2) {
      if (!form.contacto_1.trim()) return 'El teléfono de contacto principal es obligatorio.';
      if (!form.email.trim()) return 'El email es obligatorio.';
      // Validación simple
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'El email no parece válido.';
    }
    return null;
  }

  function siguiente() {
    const err = validarPaso();
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg('');
    setPaso((p) => Math.min(p + 1, PASOS.length));
  }

  function anterior() {
    setErrorMsg('');
    setPaso((p) => Math.max(p - 1, 1));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validarPaso();
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    try {
      const body = {
        nombre_empresa: form.nombre_empresa.trim(),
        rubro: form.rubro.trim() || null,
        estado_operativo: form.estado_operativo,
        responsable: form.responsable.trim(),
        contacto_1: form.contacto_1.trim(),
        contacto_2: form.contacto_2.trim() || null,
        email: form.email.trim(),
        direccion: form.direccion.trim() || null,
        manzana: form.manzana.trim() || null,
      };
      // Si el visitante eligió un lote en el mapa, lo mandamos como interés.
      if (lotePreseleccionado?.id) {
        body.lote_id = Number(lotePreseleccionado.id);
      }

      const res = await fetch(`${API_URL}/public_register_empresa.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json || json.status !== 'ok') {
        setErrorMsg(json?.mensaje || `Error al registrar (HTTP ${res.status}).`);
        return;
      }
      setSuccessData(json);
      onCompleted?.();
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo enviar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream text-bark flex flex-col">
      <header className="relative bg-sage text-cream shadow-sm z-[9999]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-cream/90 border border-cream/40 hover:border-cream hover:bg-cream/10 px-4 py-2 rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Volver al inicio
          </button>
          <h1 className="font-serif text-lg sm:text-2xl tracking-wide truncate">
            Registro de Empresa
          </h1>
          {onLoginClick ? (
            <button
              type="button"
              onClick={onLoginClick}
              className="text-xs text-cream/80 hover:text-cream underline-offset-2 hover:underline"
            >
              Acceso gestores
            </button>
          ) : (
            <div className="w-32" />
          )}
        </div>
      </header>

      <main className="flex-1 py-10 sm:py-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {successData ? (
            <div className="bg-white border border-sage/20 rounded-2xl shadow-sm p-8 sm:p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-sage/15 border border-sage/30 mx-auto mb-4 flex items-center justify-center text-sage text-2xl">
                ✓
              </div>
              <h2 className="font-serif text-2xl text-bark mb-2">¡Solicitud enviada!</h2>
              <p className="text-sm text-bark/70 leading-relaxed mb-5">
                {successData.mensaje || 'Tu solicitud quedó registrada con éxito. Un gestor la revisará a la brevedad.'}
              </p>
              <p className="text-xs text-bark/50 mb-6">
                Nº de seguimiento interno: <span className="font-mono text-bark">{successData.id}</span>
              </p>
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-sage text-cream hover:bg-moss transition-colors"
              >
                Volver al inicio
              </button>
            </div>
          ) : (
            <div className="bg-white border border-sage/20 rounded-2xl shadow-sm p-6 sm:p-10">
              <div className="text-center mb-2">
                <span className="inline-block text-xs uppercase tracking-widest text-moss font-semibold">
                  Parque Industrial El Pantanillo
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-bark mt-1">
                  Sumate al padrón provincial
                </h2>
                <p className="text-sm text-bark/60 mt-1">
                  Completá los siguientes pasos. Un gestor revisará tu información.
                </p>
              </div>

              <StepIndicator paso={paso} />

              {errorMsg && (
                <div role="alert" className="mb-5 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-800">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {paso === 1 && (
                  <>
                    <Campo label="Nombre de la empresa">
                      <input type="text" required value={form.nombre_empresa} onChange={update('nombre_empresa')} className={INPUT_CLS} placeholder="Empresa SA" />
                    </Campo>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Campo label="Rubro" optional>
                        <input type="text" value={form.rubro} onChange={update('rubro')} className={INPUT_CLS} placeholder="Metalúrgica, alimentos..." />
                      </Campo>
                      <Campo label="Estado operativo">
                        <select value={form.estado_operativo} onChange={update('estado_operativo')} className={INPUT_CLS}>
                          <option value="ACTIVA">Activa</option>
                          <option value="INACTIVA">Inactiva</option>
                          <option value="EN_GESTION">En gestión</option>
                        </select>
                      </Campo>
                    </div>
                    <Campo label="Responsable">
                      <input type="text" required value={form.responsable} onChange={update('responsable')} className={INPUT_CLS} placeholder="Nombre del titular o representante" />
                    </Campo>
                  </>
                )}

                {paso === 2 && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Campo label="Contacto principal">
                        <input type="tel" required value={form.contacto_1} onChange={update('contacto_1')} className={INPUT_CLS} placeholder="+54 9 383..." />
                      </Campo>
                      <Campo label="Contacto alternativo" optional>
                        <input type="tel" value={form.contacto_2} onChange={update('contacto_2')} className={INPUT_CLS} placeholder="Línea fija u otro celular" />
                      </Campo>
                    </div>
                    <Campo label="Email">
                      <input type="email" required value={form.email} onChange={update('email')} className={INPUT_CLS} placeholder="contacto@empresa.com" />
                    </Campo>
                  </>
                )}

                {paso === 3 && (
                  <>
                    {lotePreseleccionado && (
                      <div className="rounded-xl border border-sage/30 bg-sage/10 px-4 py-3 mb-1">
                        <div className="flex items-start gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-moss shrink-0 mt-0.5">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <div className="text-sm">
                            <p className="text-bark font-medium">
                              Terreno de interés seleccionado
                              {lotePreseleccionado.sector ? `: Sector ${lotePreseleccionado.sector}` : ''}
                              {lotePreseleccionado.numero_lote ? ` · Lote ${lotePreseleccionado.numero_lote}` : ''}
                            </p>
                            {formatSuperficie(lotePreseleccionado.superficie_m2) && (
                              <p className="text-xs text-bark/70 mt-0.5">
                                Superficie: {formatSuperficie(lotePreseleccionado.superficie_m2)}
                              </p>
                            )}
                            <p className="text-[11px] text-bark/60 mt-1 italic">
                              Vamos a registrar tu interés sobre este lote. La asignación
                              definitiva la confirma el gestor.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <Campo label="Dirección" optional>
                      <input type="text" value={form.direccion} onChange={update('direccion')} className={INPUT_CLS} placeholder="Calle, número, referencias" />
                    </Campo>
                    <Campo label="Manzana" optional>
                      <input type="text" value={form.manzana} onChange={update('manzana')} className={INPUT_CLS} placeholder="Ej: M-12" />
                    </Campo>
                    {!lotePreseleccionado && (
                      <p className="text-xs text-bark/60 italic">
                        La asignación de lote dentro del parque la realiza el gestor luego de revisar tu solicitud.
                      </p>
                    )}
                  </>
                )}

                <div className="flex items-center justify-between gap-2 pt-4 border-t border-sage/15 mt-6">
                  <button
                    type="button"
                    onClick={anterior}
                    disabled={paso === 1 || submitting}
                    className="px-4 py-2 rounded-lg text-sm text-bark/70 hover:bg-cream/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ← Atrás
                  </button>
                  {paso < PASOS.length ? (
                    <button
                      type="button"
                      onClick={siguiente}
                      className="px-5 py-2 rounded-lg text-sm font-medium bg-sage text-cream hover:bg-moss shadow-sm transition-colors"
                    >
                      Siguiente →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 rounded-lg text-sm font-medium bg-sage text-cream hover:bg-moss shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                      {submitting && (
                        <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-cream/40 border-t-cream animate-spin" />
                      )}
                      {submitting ? 'Enviando...' : 'Enviar solicitud'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-bark/60 border-t border-sage/15 mt-auto">
        © Observatorio Industrial · Catamarca
      </footer>
    </div>
  );
}
