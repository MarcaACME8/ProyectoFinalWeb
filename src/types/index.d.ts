export type Role = 'usuario' | 'admin';

export interface Profile {
  id: string;
  nombre?: string | null;
  email?: string | null;
  rol?: Role;
  imagen_url?: string | null;
  created_at?: string;
}

export interface Incident {
  id: string;
  usuario_id: string;
  titulo?: string | null;
  tipo: string;
  descripcion: string;
  imagen_url: string;
  ubicacion_texto?: string | null;
  salon?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  estado: 'reportado' | 'en_proceso' | 'resuelto';
  grupo_id?: string | null;
  created_at?: string;
  updated_at?: string;
}
