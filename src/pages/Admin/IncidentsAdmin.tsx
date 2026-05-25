import React, { useEffect, useState } from 'react';
import { getAllIncidents, updateIncidentStatus, groupIncidents } from '../../services/incidents';
import { toast } from 'sonner';
import type { Incident } from '../../types';

export default function IncidentsAdmin(){
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const fetch = async () => {
    const { data } = await getAllIncidents();
    setIncidents(data ?? []);
  };

  useEffect(() => { fetch(); }, []);

  const toggle = (id: string) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  const handleStatusChange = async (id: string, estado: string) => {
    const { error } = await updateIncidentStatus(id, estado);
    if (error) return toast.error(error.message || 'Error');
    toast.success('Estado actualizado');
    fetch();
  };

  const handleGroup = async () => {
    const ids = Object.keys(selected).filter(k => selected[k]);
    if (ids.length < 2) return toast.error('Selecciona al menos 2 incidentes para agrupar');
    const { error, grupo_id } = await groupIncidents(ids);
    if (error) return toast.error(error.message || 'Error agrupando');
    toast.success(`Incidentes agrupados en ${grupo_id}`);
    setSelected({});
    fetch();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Gestión de incidentes</h2>
        <div>
          <button onClick={handleGroup} className="px-3 py-1 bg-sky-600 text-white rounded">Agrupar seleccionados</button>
        </div>
      </div>
      <div className="space-y-3">
        {incidents.map(i => (
          <div key={i.id} className="bg-white p-4 rounded shadow flex gap-4 items-start">
            <input type="checkbox" checked={!!selected[i.id]} onChange={() => toggle(i.id)} />
            <img src={i.imagen_url} alt="img" className="w-28 h-20 object-cover rounded" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{i.tipo}</h3>
                  <p className="text-sm text-slate-600">{i.descripcion}</p>
                  <p className="text-xs text-slate-500">{new Date(i.created_at || '').toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <select value={i.estado} onChange={(e) => handleStatusChange(i.id, e.target.value)} className="border p-1 rounded">
                    <option value="reportado">Reportado</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="resuelto">Resuelto</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
