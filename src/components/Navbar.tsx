import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, FileText, Grid, LogOut, ShieldAlert, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthProvider';
import { useNotifications } from '../hooks/useNotifications';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, profile, loading, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const handleLogout = async () => {
    const { error } = await logout();
    if (error) {
      console.error('Logout error:', error);
      return;
    }
    navigate('/auth/login');
  };

  if (loading || !user) {
    return null;
  }
  const isAdmin = profile?.rol === 'admin';

  const portalTitle = isAdmin
    ? 'Panel Administrativo'
    : 'Portal de Incidentes';

  const portalSubtitle = isAdmin
    ? 'Control General del Sistema'
    : 'Sistema de Reportes';

  const dashboardLabel = isAdmin
    ? 'Dashboard General'
    : 'Panel Principal';

  const reportsLabel = isAdmin
    ? 'Todos los Reportes'
    : 'Mis Reportes';

  const statsLabel = isAdmin
    ? 'Estadísticas Globales'
    : 'Mis Estadísticas';

  const welcomeRole = isAdmin
    ? 'Administrador del sistema'
    : 'Usuario del sistema';
  return (
    <>
      <aside className="no-print hidden lg:fixed lg:top-0 lg:left-0 lg:z-20 lg:h-screen lg:w-72 lg:flex lg:flex-col lg:justify-between lg:border-r lg:border-slate-200 lg:bg-white lg:px-6 lg:py-8 lg:overflow-y-auto">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-sky-900 text-white shadow-lg shadow-sky-900/10">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {portalTitle}
              </p>
              <p className="text-xs text-slate-500">
                {portalSubtitle}
              </p>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            <Link to="/dashboard" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900">
              <Grid className="w-4 h-4" />
              {dashboardLabel}
            </Link>
            <Link to="/reports" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900">
              <FileText className="w-4 h-4" />
              {reportsLabel}
            </Link>
            <Link to="/notifications" className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4" />
                Notificaciones
              </div>
              {unreadCount > 0 && (
                <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-rose-500 px-2 py-1 text-[0.65rem] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link to="/statistics" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900">
              <BarChart3 className="w-4 h-4" />
              {statsLabel}
            </Link>
            {profile?.rol === 'admin' && (
              <Link to="/admin" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900">
                <ShieldAlert className="w-4 h-4" />
                {portalTitle}
              </Link>
            )}
            <Link to="/profile" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900">
              <UserCircle className="w-4 h-4" />
              Perfil
            </Link>
          </nav>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Bienvenido</p>
            <p className="mt-2 font-semibold text-slate-900">{profile?.nombre ?? 'Usuario'}</p>
            <p className="text-xs text-slate-500">{welcomeRole}</p>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>

        </div>
      </aside>

      <header className="no-print lg:hidden border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-slate-900">{portalTitle}</p>
            <p className="text-xs text-slate-500">{portalSubtitle}</p>
          </div>
          <button onClick={handleLogout} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Cerrar Sesión
          </button>
        </div>
      </header>
    </>
  );
}
