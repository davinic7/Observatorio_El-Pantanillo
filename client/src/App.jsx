import { useCallback, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import LotesTable from './components/LotesTable';
import MapaParque from './components/MapaParque';
import EmpresasTable from './components/EmpresasTable';
import MetricasDashboard from './components/MetricasDashboard';
import Configuracion from './components/Configuracion';
import LandingPage from './components/LandingPage';
import NovedadesTable from './components/NovedadesTable';
import ConsultasTable from './components/ConsultasTable';
import DDJJTable from './components/DDJJTable';
import NoticiasPage from './pages/NoticiasPage';
import { API_URL } from './utils/apiUrl';

const SIDEBAR_LINKS = [
  { label: 'Dashboard', tab: 'dashboard' },
  { label: 'Empresas', tab: 'empresas' },
  { label: 'Declaraciones', tab: 'ddjj' },
  { label: 'Novedades', tab: 'novedades' },
  { label: 'Consultas', tab: 'consultas', badgeKey: 'consultas_sin_leer' },
  { label: 'Configuración', tab: 'configuracion' },
];

function Navbar({ onMenuClick, onLogout, user, siteName }) {
  const isGestor = user?.rol === 'ministerio';

  return (
    <header className="fixed top-0 inset-x-0 h-16 bg-sage text-cream shadow-sm z-[9999] flex items-center px-4 sm:px-6 gap-3">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú"
        className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md hover:bg-cream/10 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <h1 className="font-serif text-lg sm:text-xl tracking-wide truncate">
        {siteName || 'Observatorio Industrial'}
      </h1>

      <div className="ml-auto flex items-center gap-3">
        {user?.email && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-cream/80 italic">
            <span>
              Hola, <span className="not-italic font-medium text-cream">{user.email}</span>
            </span>
            {isGestor && (
              <span className="not-italic inline-flex items-center px-2 py-0.5 rounded-full bg-cream/15 border border-cream/40 text-[10px] uppercase tracking-wider font-semibold text-cream">
                Gestor
              </span>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 text-sm font-medium text-cream/90 border border-cream/30 hover:border-cream hover:bg-cream/10 px-3 py-1.5 rounded-md transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}

function Sidebar({ open, onClose, activeTab, onSelectTab, badges = {} }) {
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="md:hidden fixed inset-0 top-16 bg-bark/40 z-10"
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed top-16 bottom-0 left-0 w-64 bg-moss text-cream z-20 px-4 py-6 transform transition-transform duration-200 ease-out md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex flex-col gap-1">
          {SIDEBAR_LINKS.map((link) => {
            const isActive = link.tab === activeTab;
            const badgeCount = link.badgeKey ? badges[link.badgeKey] : 0;
            return (
              <button
                key={link.label}
                type="button"
                onClick={() => {
                  onSelectTab?.(link.tab);
                  onClose?.();
                }}
                className={`flex items-center justify-between text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cream/15 text-cream'
                    : 'text-cream/90 hover:bg-cream/10 hover:text-cream'
                }`}
              >
                <span>{link.label}</span>
                {badgeCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

function Dashboard({ token, onUnauthorized, refreshTrigger, triggerRefresh }) {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/get_lotes.php`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401) {
        onUnauthorized?.();
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (errData?.mensaje) {
          throw new Error(errData.mensaje);
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.status !== 'ok') {
        throw new Error(json.mensaje || 'Respuesta inválida del servidor');
      }
      setLotes(json.data ?? []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los lotes');
    } finally {
      setLoading(false);
    }
  }, [token, onUnauthorized]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <main className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 md:px-8 py-6 sm:py-10 space-y-6">
      <MetricasDashboard
        token={token}
        onUnauthorized={onUnauthorized}
        refreshTrigger={refreshTrigger}
      />
      <MapaParque lotes={lotes} />
      <LotesTable
        lotes={lotes}
        loading={loading}
        error={error}
        refetch={refetch}
        token={token}
        onUnauthorized={onUnauthorized}
        onDataChange={triggerRefresh}
      />
    </main>
  );
}

function Layout({ onLogout, user, token, activeTab, setActiveTab }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [siteConfig, setSiteConfig] = useState(() => {
    try {
      const cached = localStorage.getItem('siteConfigAdmin');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [badges, setBadges] = useState({ consultas_sin_leer: 0 });
  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`${API_URL}/get_stats.php`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && j?.status === 'ok' && j.data) {
          setBadges({
            consultas_sin_leer: j.data.consultas_sin_leer ?? 0,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token, refreshTrigger]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`${API_URL}/get_configuracion.php`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && j?.status === 'ok' && j.data) {
          setSiteConfig(j.data);
          try {
            localStorage.setItem('siteConfigAdmin', JSON.stringify(j.data));
          } catch {
            /* ignorar */
          }
        }
      })
      .catch(() => {
        /* silencioso: el navbar usa el default */
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-cream text-bark flex flex-col">
      <Navbar
        onMenuClick={() => setSidebarOpen(true)}
        onLogout={onLogout}
        user={user}
        siteName={siteConfig?.nombre_sitio}
      />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        badges={badges}
      />
      <div className="pt-16 md:pl-64 flex-1">
        {activeTab === 'empresas' && (
          <main className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 md:px-8 py-6 sm:py-10">
            <EmpresasTable
              token={token}
              onUnauthorized={onLogout}
              onDataChange={triggerRefresh}
            />
          </main>
        )}
        {activeTab === 'configuracion' && (
          <main className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 md:px-8 py-6 sm:py-10">
            <Configuracion
              token={token}
              onUnauthorized={onLogout}
              onSaved={(newConfig) => {
                setSiteConfig(newConfig);
                try {
                  localStorage.setItem('siteConfigAdmin', JSON.stringify(newConfig));
                } catch {
                  /* ignorar */
                }
              }}
            />
          </main>
        )}
        {activeTab === 'novedades' && (
          <main className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 md:px-8 py-6 sm:py-10">
            <NovedadesTable
              token={token}
              onUnauthorized={onLogout}
              onDataChange={triggerRefresh}
            />
          </main>
        )}
        {activeTab === 'consultas' && (
          <main className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 md:px-8 py-6 sm:py-10">
            <ConsultasTable
              token={token}
              onUnauthorized={onLogout}
              onDataChange={triggerRefresh}
            />
          </main>
        )}
        {activeTab === 'ddjj' && (
          <main className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 md:px-8 py-6 sm:py-10">
            <DDJJTable
              token={token}
              onUnauthorized={onLogout}
              onDataChange={triggerRefresh}
            />
          </main>
        )}
        {activeTab !== 'empresas' && activeTab !== 'configuracion' && activeTab !== 'novedades' && activeTab !== 'consultas' && activeTab !== 'ddjj' && (
          <Dashboard
            token={token}
            onUnauthorized={onLogout}
            refreshTrigger={refreshTrigger}
            triggerRefresh={triggerRefresh}
          />
        )}
      </div>
      <footer className="md:pl-64 py-4 text-center text-sm text-bark/60 mt-auto">
        {siteConfig?.texto_footer || '© Observatorio Industrial'}
      </footer>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);
  const [publicView, setPublicView] = useState('landing'); // 'landing' | 'noticias'

  function handleLogin({ user, token }) {
    setCurrentUser(user);
    setAuthToken(token);
    setIsAuthenticated(true);
    setShowLogin(false);
  }

  function handleLogout() {
    setCurrentUser(null);
    setAuthToken(null);
    setIsAuthenticated(false);
    setActiveTab('dashboard');
    setShowLogin(false);
  }

  if (!isAuthenticated) {
    if (showLogin) {
      return <Login onLogin={handleLogin} onBack={() => setShowLogin(false)} />;
    }
    if (publicView === 'noticias') {
      return <NoticiasPage onBack={() => setPublicView('landing')} />;
    }
    return (
      <LandingPage
        onLoginClick={() => setShowLogin(true)}
        onVerMasNoticias={() => setPublicView('noticias')}
      />
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout
            onLogout={handleLogout}
            user={currentUser}
            token={authToken}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        }
      />
    </Routes>
  );
}
