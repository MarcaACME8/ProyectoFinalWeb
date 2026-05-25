import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, FilePlus, Search, MoreHorizontal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Incident } from '../types';
import Skeleton from '../components/Skeleton';
import { useAuth } from '../context/AuthProvider';

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'reportado', label: 'Reportado' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'resuelto', label: 'Resuelto' },
];

const tipoLabels: Record<string, string> = {
  bano: 'Baño',
  electricidad: 'Electricidad',
  infraestructura: 'Infraestructura',
  seguridad: 'Seguridad',
  otro: 'Otro'
};

export default function Reports() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

 const { user, profile } = useAuth();

useEffect(() => {
  if (!user || !profile) return;

  (async () => {
    let query = supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });

    // Si NO es admin, solo ve sus incidentes
    if (profile.rol !== 'admin') {
      query = query.eq('usuario_id', user.id);
    }

    const { data, error } = await query;

    if (!error && data) {
      setIncidents(data as Incident[]);
    }

    setLoading(false);
  })();
}, [user, profile]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      if (statusFilter && incident.estado !== statusFilter) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          (incident.titulo ?? incident.tipo).toLowerCase().includes(query) ||
          incident.tipo.toLowerCase().includes(query) ||
          incident.descripcion.toLowerCase().includes(query) ||
          incident.id.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [incidents, statusFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-700 font-semibold">Portal &gt; Mis reportes</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Gestión de incidentes</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-500">Revisa tus reportes, filtra por estado y accede a los detalles de cada caso.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <Link
              to="/incidents/new"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200/30 transition hover:bg-sky-800"
            >
              <FilePlus className="w-4 h-4" />
              Nuevo Reporte de Incidente
            </Link>
          </div>
        </div>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_2fr]">
            <div>
              <label className="block text-sm font-medium text-slate-700">Estado</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Buscar</label>
              <div className="mt-2 relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar por título, descripción o ID"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-end justify-end">
              <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                <MoreHorizontal className="w-4 h-4" />
                Aplicar filtros
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Resultados</p>
              <p className="mt-1 text-sm text-slate-500">Mostrando {loading ? 'cargando' : `${filteredIncidents.length}`} reportes</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Título</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-t border-slate-100">
                      <td className="px-6 py-5"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-5"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-6 py-5"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-5"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-5"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-5"><Skeleton className="h-4 w-16" /></td>
                    </tr>
                  ))
                ) : filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No hay reportes que coincidan con los filtros.</td>
                  </tr>
                ) : (
                  filteredIncidents.map((incident) => (
                    <tr key={incident.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-5 font-medium text-slate-900">#{incident.id.slice(0, 8)}</td>
                      <td className="px-6 py-5 text-slate-900">{incident.titulo || incident.tipo || 'Sin título'}</td>
                      <td className="px-6 py-5 text-slate-600">{tipoLabels[incident.tipo] ?? incident.tipo}</td>
                      <td className="px-6 py-5 text-slate-600">{incident.created_at ? new Date(incident.created_at).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                            incident.estado === 'resuelto'
                              ? 'bg-emerald-100 text-emerald-700'
                              : incident.estado === 'en_proceso'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-sky-100 text-sky-700'
                          }`}
                        >
                          {incident.estado === 'resuelto' ? 'Resuelto' : incident.estado === 'en_proceso' ? 'En proceso' : 'Reportado'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-700">
                        <Link to={`/incidents/${incident.id}`} className="inline-flex items-center gap-2 text-sky-600 font-medium hover:text-sky-700">
                          Ver detalles
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
