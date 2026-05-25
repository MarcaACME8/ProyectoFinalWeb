import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Incident, Profile } from '../../types';
import Skeleton from '../../components/Skeleton';
import { toast } from 'sonner';
import { ArrowRight, X } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';

const priorityLabels: Record<string, { label: string; color: string; subtitle: string }> = {
  reportado: { label: 'Alta', color: 'bg-rose-100 text-rose-700', subtitle: 'Revisión urgente' },
  en_proceso: { label: 'Media', color: 'bg-amber-100 text-amber-700', subtitle: 'En curso' },
  resuelto: { label: 'Baja', color: 'bg-emerald-100 text-emerald-700', subtitle: 'Resuelto' },
};

export default function IncidentDetail() {
  const { id } = useParams();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [reporter, setReporter] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('reportado');
  const [saving, setSaving] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
const { profile } = useAuth();
  useEffect(() => {
    if (!id) return;

    const loadIncident = async () => {
      setLoading(true);
      const { data } = await supabase.from('incidents').select('*').eq('id', id).maybeSingle();
      const incidentData = data as Incident | null;
      setIncident(incidentData);
      setStatus(incidentData?.estado ?? 'reportado');

      if (incidentData?.usuario_id) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', incidentData.usuario_id).maybeSingle();
        setReporter(profileData as Profile | null);
      }

      setLoading(false);
    };

    loadIncident();
  }, [id]);

  const handleStatusChange = async () => {
    if (!incident) return;
    setSaving(true);
    const { error } = await supabase.from('incidents').update({ estado: status }).eq('id', incident.id).select().maybeSingle();
    setSaving(false);

    if (error) {
      toast.error('Error al actualizar el estado: ' + error.message);
      return;
    }

    toast.success('Estado del reporte actualizado');
    setIncident({ ...incident, estado: status });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="h-12 w-3/4 rounded mb-6" />
          <Skeleton className="h-72 rounded-xl mb-6" />
          <Skeleton className="h-10 rounded-full mb-4" />
          <Skeleton className="h-60 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow">
          Incidente no encontrado.
        </div>
      </div>
    );
  }

  const statusInfo = priorityLabels[incident.estado] ?? priorityLabels.reportado;
  const imageUrl = incident.imagen_url || 'https://images.unsplash.com/photo-1501927023255-9063be98970b?auto=format&fit=crop&w=1400&q=80';

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      {viewerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[28px] bg-slate-900 shadow-2xl">
            <button
              type="button"
              onClick={() => setViewerOpen(false)}
              className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-900 shadow-lg transition hover:bg-white"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={imageUrl}
              alt={incident.titulo ?? 'Incidente'}
              className="h-[80vh] w-full object-contain bg-slate-900"
            />
          </div>
        </div>
      )}
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 xl:grid-cols-[1.9fr_1.1fr] items-start">
          <div className="space-y-4">
            <section className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <button
                type="button"
                onClick={() => setViewerOpen(true)}
                className="group relative overflow-hidden rounded-[28px] bg-slate-950/5 transition hover:shadow-lg"
              >
                <img
                  src={imageUrl}
                  alt={incident.titulo ?? 'Incidente'}
                  className="h-[620px] w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                <div className="absolute inset-0 flex items-end justify-between p-6">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition group-hover:bg-white">
                    Ver imagen completa
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </button>
            </section>

            <section className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Detalles del reporte</p>
              <div className="mt-6 rounded-[28px] bg-slate-50 p-5 text-slate-700">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Descripción</p>
                <p className="mt-3 text-sm leading-7 text-slate-900">{incident.descripcion}</p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-[28px] bg-slate-50 p-5 text-slate-700">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Reportado por</p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{reporter?.nombre ?? 'Usuario desconocido'}</p>
                  <p className="mt-1 text-sm text-slate-500">{reporter?.email ?? 'Sin correo'}</p>
                </div>
                <div className="rounded-[28px] bg-slate-50 p-5 text-slate-700">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Ubicación</p>
                  <p className="mt-3 text-sm font-medium text-slate-900">{incident.salon || incident.ubicacion_texto || 'No disponible'}</p>
                </div>
                <div className="rounded-[28px] bg-slate-50 p-5 text-slate-700">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Fecha de creación</p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{incident.created_at ? new Date(incident.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No disponible'}</p>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="sticky top-8 space-y-6">
              <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Ubicación</p>
                <div className="mt-4 rounded-[28px] bg-slate-100 p-6 text-slate-700">
                  <p className="text-sm text-slate-500">Coordenadas registradas</p>
                  <p className="mt-3 text-sm font-medium text-slate-900">{incident.latitud && incident.longitud ? `${incident.latitud}, ${incident.longitud}` : 'No hay coordenadas disponibles'}</p>
                </div>
                {incident.latitud && incident.longitud ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${incident.latitud},${incident.longitud}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Ver ubicación guardada
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-slate-300 px-4 py-3 text-sm font-semibold text-slate-600"
                  >
                    No hay coordenadas disponibles
                  </button>
                )}
              </div>

              {profile?.rol === 'admin' && (
  <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
      Actualizar estado
    </p>

    <h3 className="mt-3 text-lg font-semibold text-slate-900">
      Estado actual
    </h3>

    <p className="mt-2 text-sm text-slate-500">
      Controla el estado del incidente directamente desde este panel.
    </p>

    <div className="mt-6 space-y-4">
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
      >
        <option value="reportado">Reportado</option>
        <option value="en_proceso">En proceso</option>
        <option value="resuelto">Resuelto</option>
      </select>

      <button
        onClick={handleStatusChange}
        disabled={saving || status === incident.estado}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {saving ? 'Guardando...' : 'Guardar estado'}

        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  </div>
)}

            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
