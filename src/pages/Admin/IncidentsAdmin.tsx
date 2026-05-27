import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAdminIncidentGroups } from '../../hooks/useAdminIncidentGroups';
import type { Incident } from '../../types';

const statusOptions: Array<{ value: Incident['estado']; label: string }> = [
  { value: 'reportado', label: 'Reportado' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'resuelto', label: 'Resuelto' }
];

export default function IncidentsAdmin() {
  const {
    incidents,
    loading,
    saving,
    selected,
    selectedCount,
    toggleSelection,
    clearSelection,
    createGroup,
    syncGroupStatus
  } = useAdminIncidentGroups();

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  const hasSelection = selectedCount > 0;
  const selectedIncidents = useMemo(
    () => incidents.filter((incident) => selected[incident.id]),
    [incidents, selected]
  );

  const handleOpenGroupModal = () => {
    if (selectedCount < 2) {
      toast.error('Selecciona al menos 2 incidentes antes de agruparlos.');
      return;
    }
    setGroupModalOpen(true);
  };

  const handleCreateGroup = async () => {
    if (!groupTitle.trim()) {
      toast.error('Ingresa un título para el grupo.');
      return;
    }

    const { error } = await createGroup(groupTitle.trim(), groupDescription.trim());
    if (error) {
      toast.error(error.message || 'Error creando el grupo.');
      return;
    }

    toast.success('Grupo de incidentes creado correctamente.');
    setGroupModalOpen(false);
    setGroupTitle('');
    setGroupDescription('');
  };

  const handleGroupStatusChange = async (groupId: string, status: Incident['estado']) => {
    const { error } = await syncGroupStatus(groupId, status);
    if (error) {
      toast.error(error.message || 'No fue posible sincronizar el estado del grupo.');
      return;
    }
    toast.success('Estado del grupo sincronizado con los incidentes.');
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">Administración de incidentes</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">Agrupación de incidentes</h1>
              <p className="mt-2 text-sm text-slate-500">Selecciona incidentes similares y crea un grupo para tratar su estado de forma sincronizada.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleOpenGroupModal}
                disabled={!hasSelection || saving}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                Agrupar incidentes ({selectedCount})
              </button>
              <button
                type="button"
                onClick={() => clearSelection()}
                disabled={!hasSelection || saving}
                className="inline-flex items-center justify-center rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                Limpiar selección
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] bg-slate-50 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Incidentes totales</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{incidents.length}</p>
            </div>
            <div className="rounded-[28px] bg-slate-50 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Seleccionados</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{selectedCount}</p>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-[28px] bg-slate-100" />
              ))
            ) : (
              incidents.map((incident) => (
                <div key={incident.id} className="rounded-[32px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-slate-700 shadow-sm">
                          <input
                            type="checkbox"
                            checked={!!selected[incident.id]}
                            onChange={() => toggleSelection(incident.id)}
                            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                          />
                          Seleccionar
                        </label>
                        {(incident.group_id || incident.grupo_id) && (
                          <span className="rounded-full bg-sky-100 px-3 py-2 text-xs font-semibold text-sky-700">Agrupado</span>
                        )}
                        {incident.incident_groups?.title && (
                          <span className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white">{incident.incident_groups.title}</span>
                        )}
                      </div>

                      <h2 className="text-xl font-semibold text-slate-900">{incident.titulo ?? 'Incidente sin título'}</h2>
                      <p className="text-sm text-slate-600">{incident.descripcion}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Tipo</p>
                          <p className="mt-2 font-semibold text-slate-900">{incident.tipo}</p>
                        </div>
                        <div className="rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Estado sincronizado</p>
                          <p className="mt-2 font-semibold text-slate-900 capitalize">{incident.estado.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <img src={incident.imagen_url} alt={incident.titulo ?? 'Incidente'} className="h-40 w-full min-w-[220px] rounded-3xl object-cover" />
                      {(incident.group_id || incident.grupo_id) && incident.incident_groups && (
                        <div className="rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Grupo</p>
                          <p className="mt-2 font-semibold text-slate-900">{incident.incident_groups.title ?? 'Grupo sin nombre'}</p>
                          <p className="mt-1 text-sm text-slate-500">{incident.incident_groups.description ?? 'Sin descripción del grupo'}</p>
                          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-slate-500">Estado del grupo</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{incident.incident_groups.status.replace('_', ' ')}</span>
                            <button
                              type="button"
                              onClick={() => handleGroupStatusChange(incident.incident_groups!.id, incident.estado)}
                              className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                            >
                              Sincronizar estado
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {groupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
          <div className="w-full max-w-2xl rounded-[32px] bg-white p-8 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Crear grupo de incidentes</h2>
                <p className="mt-2 text-sm text-slate-500">Asigna un título y descripción para el nuevo grupo. Se sincronizará el estado de todas las incidencias seleccionadas.</p>
              </div>
              <button
                type="button"
                onClick={() => setGroupModalOpen(false)}
                className="text-slate-400 transition hover:text-slate-700"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-8 grid gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Título del grupo</label>
                <input
                  value={groupTitle}
                  onChange={(event) => setGroupTitle(event.target.value)}
                  placeholder="Ej: Incidentes de electricidad - Bloque A"
                  className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Descripción</label>
                <textarea
                  value={groupDescription}
                  onChange={(event) => setGroupDescription(event.target.value)}
                  rows={4}
                  placeholder="Describe por qué estos incidentes deben tratarse juntos."
                  className="mt-3 w-full rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div className="rounded-[28px] bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">Incidentes seleccionados</p>
                <p className="mt-2 text-sm text-slate-500">{selectedCount} incidentes serán agrupados.</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {selectedIncidents.map((incident) => (
                    <li key={incident.id} className="rounded-3xl bg-white p-3 shadow-sm">
                      <p className="font-semibold text-slate-900">{incident.titulo ?? 'Sin título'}</p>
                      <p className="text-slate-500">{incident.tipo} • {incident.estado.replace('_', ' ')}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => setGroupModalOpen(false)}
                className="rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={saving}
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                Crear grupo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
