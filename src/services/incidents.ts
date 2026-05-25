import { supabase } from '../lib/supabase';
import type { Incident } from '../types';

export async function getAllIncidents(): Promise<{ data: Incident[] | null; error: any }>{
  const { data, error } = await supabase.from('incidents').select('*').order('created_at', { ascending: false });
  return { data: data as Incident[] | null, error };
}

export async function updateIncidentStatus(id: string, estado: string){
  const { data, error } = await supabase.from('incidents').update({ estado }).eq('id', id).select().maybeSingle();
  return { data, error };
}

export async function groupIncidents(ids: string[]){
  const grupo_id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const { data, error } = await supabase.from('incidents').update({ grupo_id }).in('id', ids).select();
  return { data, error, grupo_id };
}
