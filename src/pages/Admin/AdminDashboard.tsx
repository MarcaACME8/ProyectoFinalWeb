import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllIncidents } from '../../services/incidents';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

export default function AdminDashboard(){
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: incidents } = await getAllIncidents();
      if (!incidents) return;
      // incidents by estado
      const byEstado = ['reportado','en_proceso','resuelto'].map((s) => ({ name: s, value: incidents.filter(i => i.estado === s).length }));
      // incidents by tipo
      const tiposMap: Record<string, number> = {};
      incidents.forEach(i => { tiposMap[i.tipo] = (tiposMap[i.tipo] || 0) + 1; });
      const byTipo = Object.entries(tiposMap).map(([name, value]) => ({ name, value }));
      setData([byEstado, byTipo]);
    })();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Admin — Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Incidentes por estado</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data[0]} dataKey="value" nameKey="name" outerRadius={80} label>
                  {data[0]?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Incidentes por tipo</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={data[1]}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="mt-8 rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Gestión</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Acceso rápido a la administración de incidentes</h3>
            <p className="mt-2 text-sm text-slate-500">Desde aquí puedes abrir el panel dedicado a la agrupación, asignación y seguimiento de incidentes.</p>
          </div>
          <Link
            to="/admin/incidents"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Ir a administración de incidentes
          </Link>
        </div>
      </div>
    </div>
  );
}
