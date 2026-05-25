import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import { getAllIncidents } from '../services/incidents';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { Incident } from '../types';

export default function Profile() {
  const { profile } = useAuth();
  const [incidents, setIncidents] = useState<Incident[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.nombre ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await getAllIncidents();
      if (!mounted) return;
      setIncidents(data ?? []);
    })();
    return () => { mounted = false };
  }, []);

  const stats = useMemo(() => {
    if (!incidents || !profile) return null;

    // If admin, consider all incidents; otherwise only user's
    const relevant = profile.rol === 'admin' ? incidents : incidents.filter(i => i.usuario_id === profile.id);

    const total = relevant.length;
    const active = relevant.filter(i => i.estado !== 'resuelto').length;

    const tipoCounts: Record<string, number> = {};
    relevant.forEach(i => { tipoCounts[i.tipo] = (tipoCounts[i.tipo] || 0) + 1 });
    const tipos = Object.entries(tipoCounts).sort((a, b) => b[1] - a[1]);
    const topTipo = tipos[0]?.[0] ?? '—';
    const topPercent = total > 0 ? Math.round((Number(tipos[0]?.[1] ?? 0) / total) * 100) : 0;

    return { total, active, topTipo, topPercent };
  }, [incidents, profile]);

  if (!profile) {
    return <div className="p-6 max-w-4xl mx-auto">Cargando perfil...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg flex items-center gap-6">
        <button onClick={() => { setEditing(true); setNameInput(profile.nombre ?? '') }} className="relative group cursor-pointer">
          <img src={profile.imagen_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.nombre || 'Usuario')}&background=0ea5e9&color=ffffff&size=128`} alt="avatar" className="w-28 h-28 rounded-full object-cover ring-1 ring-slate-100 shadow-sm group-hover:opacity-80 transition" />
          <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow -translate-y-1 translate-x-1 border border-slate-100 group-hover:scale-110 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
            </svg>
          </div>
        </button>

        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-slate-900">{profile.nombre ?? 'Usuario'}</h1>
          <p className="text-sm text-slate-500">{profile.email}</p>
          <p className="mt-2 text-xs text-slate-500">{profile.rol === 'admin' ? 'Administrador' : 'Usuario'}</p>
        </div>

        <div className="hidden md:block text-right">
          <p className="text-sm text-slate-500">Registrado el:</p>
          <p className="font-semibold">{new Date(profile.created_at || '').toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs text-slate-500">Total de reportes</p>
          <p className="text-4xl font-extrabold text-slate-900 mt-3">{stats ? stats.total : '—'}</p>
          <p className="text-xs text-slate-400 mt-2">{profile.rol === 'admin' ? 'Todos los reportes' : 'Tus reportes'}</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs text-slate-500">Investigaciones activas</p>
          <p className="text-4xl font-extrabold text-slate-900 mt-3">{stats ? stats.active.toString().padStart(2, '0') : '—'}</p>
          <p className="text-xs text-slate-400 mt-2">{stats ? `${stats.active} casos en progreso` : '—'}</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs text-slate-500">Categoría más reportada</p>
          <p className="text-xl font-semibold text-slate-900 mt-3">{stats ? stats.topTipo : '—'}</p>
          <p className="text-xs text-slate-400 mt-2">{stats ? `${stats.topPercent}% del total` : '—'}</p>
        </div>
      </div>

      {/* Edit modal / panel */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-md">
            <div className="p-8">
              <h3 className="text-2xl font-semibold text-slate-900 mb-6">Editar perfil</h3>
              
              {/* Preview section */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <img 
                    src={file ? URL.createObjectURL(file) : (profile.imagen_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.nombre || 'Usuario')}&background=0ea5e9&color=ffffff&size=128`)}
                    alt="preview"
                    className="w-24 h-24 rounded-full object-cover ring-2 ring-slate-100"
                  />
                  <div className="absolute bottom-0 right-0 bg-sky-600 rounded-full p-1.5 text-white shadow">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 19.414l-6.707-6.707a1 1 0 0 1 1.414-1.414L9 16.586l12.293-12.293a1 1 0 1 1 1.414 1.414L10.414 18z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Name input */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">Nombre completo</label>
                <input 
                  value={nameInput} 
                  onChange={(e) => setNameInput(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition bg-slate-50" 
                  placeholder="Tu nombre"
                />
              </div>

              {/* File input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Foto de perfil</label>
                <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-sky-500 hover:bg-sky-50 transition">
                  <div className="flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm font-medium text-slate-600">{file ? file.name : 'Selecciona una imagen'}</span>
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" />
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3">
                <button 
                  onClick={() => setEditing(false)} 
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={async () => {
                    setSaving(true);
                    try {
                      let publicUrl = profile.imagen_url ?? null;
                      if (file) {
                        const path = `${profile.id}/${Date.now()}-${file.name}`;
                        const upload = await supabase.storage.from('avatars').upload(path, file as File, { cacheControl: '3600', upsert: true });
                        if (upload.error) throw upload.error;
                        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
                        publicUrl = data.publicUrl;
                      }

                      const { error } = await supabase.from('profiles').update({ nombre: nameInput, imagen_url: publicUrl }).eq('id', profile.id).select();
                      if (error) throw error;
                      toast.success('Perfil actualizado');
                      setEditing(false);
                      // reload to refresh profile from provider
                      setTimeout(() => window.location.reload(), 600);
                    } catch (err: any) {
                      console.error('Update profile error', err);
                      toast.error(err?.message || 'Error actualizando perfil');
                    } finally {
                      setSaving(false);
                    }
                  }} 
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition shadow-sm disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
