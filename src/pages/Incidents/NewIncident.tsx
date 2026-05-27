import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Building, Droplet, MapPin, Save, Shield, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import { createIncident } from '../../services/incidents';

const schema = z.object({
  titulo: z.string().min(5, 'Ingrese un título para el incidente'),
  tipo: z.string().min(1),
  descripcion: z.string().min(10, 'Describe el problema con mayor detalle'),
  salon: z.string().optional(),
  ubicacion_texto: z.string().optional()
});

type FormData = z.infer<typeof schema>;

const incidentOptions = [
  { label: 'Baño', value: 'bano', icon: Droplet },
  { label: 'Electricidad', value: 'electricidad', icon: Zap },
  { label: 'Infraestructura', value: 'infraestructura', icon: Building },
  { label: 'Seguridad', value: 'seguridad', icon: Shield },
  { label: 'Otro', value: 'otro', icon: Sparkles }
];

export default function NewIncident() {
  const { register, handleSubmit, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: 'infraestructura' }
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<string>('Presiona el botón para obtener tu ubicación GPS.');
  const { user } = useAuth();

  const selectedType = watch('tipo');

  const onSubmit = async (data: FormData) => {
    if (!file) {
      toast.error('Adjunta una imagen del incidente para continuar');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error('Solo se permiten JPG, PNG o WEBP');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no debe superar 10 MB');
      return;
    }

    if (!user) {
      toast.error('No se encontró sesión de usuario. Por favor, inicia sesión de nuevo.');
      return;
    }

    setLoading(true);
    const fileName = `${Date.now()}_${file.name}`;
    const uid = user.id;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
        metadata: { owner: uid, 'content-type': file.type }
      });

    if (uploadError) {
      toast.error(uploadError.message);
      setLoading(false);
      return;
    }

    const { data: publicUrl } = supabase.storage.from('reports').getPublicUrl(uploadData.path);
    const ubicacionText =
      data.ubicacion_texto ||
      (location ? `GPS: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : data.salon ?? '');

    const { error } = await createIncident({
      usuario_id: uid,
      titulo: data.titulo,
      tipo: data.tipo,
      descripcion: data.descripcion,
      imagen_url: publicUrl.publicUrl,
      ubicacion_texto: ubicacionText,
      salon: data.salon ?? null,
      latitud: location?.lat ?? null,
      longitud: location?.lng ?? null
    });

    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Incidente reportado');
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px] space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
           
            <h1 className="mt-4 text-3xl font-semibold text-slate-900">Reportar Incidente Nuevo</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">Complete los detalles a continuación para iniciar el proceso de resolución institucional.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              <Save className="mr-2 h-4 w-4" />
              Guardar Borrador
            </button>
            <button
              type="submit"
              form="new-incident-form"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
            >
              Enviar Reporte
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>

        <form id="new-incident-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Información Básica</h2>
                <p className="mt-2 text-sm text-slate-500">Describe el incidente para que el equipo institucional pueda actuar rápidamente.</p>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">Título del Incidente</label>
                <input
                  {...register('titulo')}
                  placeholder="Ej: Fuga de agua en Laboratorio 3"
                  className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700">Tipo de Incidente</p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {incidentOptions.map((option) => {
                    const Icon = option.icon;
                    const active = selectedType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setValue('tipo', option.value)}
                        className={`rounded-3xl border px-4 py-4 text-left transition ${
                          active
                            ? 'border-sky-500 bg-sky-50 text-slate-900 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-slate-800">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="text-sm font-medium">{option.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Descripción Detallada</label>
                <textarea
                  {...register('descripcion')}
                  placeholder="Describa el problema con el mayor detalle posible..."
                  rows={8}
                  className="mt-3 w-full rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                />
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-sky-100 text-sky-700">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Ubicación Exacta</h3>
                  <p className="text-sm text-slate-500">Ajusta la ubicación del incidente en el campus.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Salón o Punto Específico</label>
                  <input
                    {...register('salon')}
                    placeholder="Ej: Aula 204, Pasillo B"
                    className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                  />
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-slate-700">Geolocalización GPS</p>
                  <div className="space-y-3 rounded-[28px] border border-slate-200 bg-slate-100 p-4 text-slate-500">
                    <button
                      type="button"
                      onClick={() => {
                        if (!navigator.geolocation) {
                          setGeoStatus('Geolocalización no soportada en este navegador.');
                          return;
                        }
                        setGeoStatus('Obteniendo ubicación...');
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setLocation({
                              lat: position.coords.latitude,
                              lng: position.coords.longitude
                            });
                            setGeoStatus(`Ubicación GPS obtenida: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
                          },
                          (error) => {
                            setGeoStatus(`Error al obtener GPS: ${error.message}`);
                          },
                          { enableHighAccuracy: true, timeout: 10000 }
                        );
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      <MapPin className="h-4 w-4" />
                      Usar GPS para ubicación
                    </button>

                    <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
                      <p className="font-medium text-slate-900">Estado de ubicación</p>
                      <p className="mt-2 text-sm text-slate-500">{geoStatus}</p>
                      {location && (
                        <p className="mt-3 text-sm text-slate-600">Coordenadas: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-slate-100 text-slate-700">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Prioridad del Sistema</h3>
                  <p className="mt-1 text-sm text-slate-500">Pendiente de clasificación automática.</p>
                </div>
              </div>
            </section>
          </aside>
        </form>

        <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Evidencia Fotográfica</h2>
              <p className="mt-2 text-sm text-slate-500">Adjunte una imagen del incidente para agilizar la evaluación.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">JPG, PNG hasta 10MB cada una</span>
          </div>

          <label htmlFor="upload" className="mt-6 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 text-center text-slate-500 transition hover:border-slate-400 hover:bg-slate-100">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-slate-700 shadow-sm">
              <MapPin className="h-6 w-6" />
            </span>
            <span className="mt-4 text-sm font-semibold text-slate-900">Haga clic para subir</span>
            <span className="mt-2 text-sm text-slate-400">JPG, PNG hasta 10MB cada una</span>
            <input
              id="upload"
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          {file && (
            <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Archivo seleccionado: <span className="font-semibold">{file.name}</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
