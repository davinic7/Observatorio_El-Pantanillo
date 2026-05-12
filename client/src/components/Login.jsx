import { useState } from 'react';
import { API_URL } from '../utils/apiUrl';

export default function Login({ onLogin, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json || json.status !== 'ok') {
        setErrorMsg('Email o contraseña incorrectos');
        return;
      }

      onLogin?.({ user: json.user, token: json.token });
    } catch {
      setErrorMsg('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-md bg-white border border-sage/20 rounded-2xl shadow-sm p-8 sm:p-10 relative">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-xs font-medium text-bark/60 hover:text-moss transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Volver
          </button>
        )}
        <header className="mb-8 text-center">
          <h1 className="font-serif text-3xl text-bark tracking-wide">
            Acceso al Observatorio
          </h1>
          <p className="mt-2 text-sm text-bark/60">
            Ingresá tus credenciales para continuar
          </p>
        </header>

        {errorMsg && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-wide text-bark/70 mb-2 font-semibold"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-sage/30 bg-cream/40 px-4 py-2.5 text-bark placeholder-bark/40 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-wide text-bark/70 mb-2 font-semibold"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-sage/30 bg-cream/40 px-4 py-2.5 text-bark placeholder-bark/40 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-sage text-cream font-medium py-2.5 rounded-lg shadow-sm hover:bg-moss hover:shadow transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sage/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-sage flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-cream/40 border-t-cream animate-spin" />
            )}
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
