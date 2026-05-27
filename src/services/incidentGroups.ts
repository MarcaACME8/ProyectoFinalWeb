import { supabase } from '../lib/supabase';
import type { Incident, IncidentGroup } from '../types';

const incidentSelect = `
  *,
  incident_groups (
    id,
    title,
    description,
    status
  )
`;

export async function getAdminIncidentsWithGroups(): Promise<{ data: Incident[] | null; error: any }> {
  const { data, error } = await supabase
    .from('incidents')
    .select(incidentSelect)
    .order('created_at', { ascending: false });

  if (!error && data) {
    return { data: data as Incident[] | null, error: null };
  }

  console.warn('getAdminIncidentsWithGroups: failed to load incident_groups relation, retrying without relation', error);

  const fallback = await supabase
    .from('incidents')
    .select('*')
    .order('created_at', { ascending: false });

  return { data: fallback.data as Incident[] | null, error: fallback.error ?? error };
}

export async function createIncidentGroupWithIncidents(
  title: string,
  description: string,
  incidentIds: string[]
): Promise<{ data: IncidentGroup | null; error: any }> {
  const { data, error } = await supabase.rpc('create_incident_groups_with_incidents', {
    _title: title,
    _description: description,
    _status: 'reportado',
    _incident_ids: incidentIds
  });

  return { data: data as IncidentGroup | null, error };
}

export async function updateIncidentGroupStatus(groupId: string, status: Incident['estado']): Promise<{ data: IncidentGroup | null; error: any }> {
  const { data, error } = await supabase.rpc('update_incident_groups_status', {
    _group_id: groupId,
    _status: status
  });

  return { data: data as IncidentGroup | null, error };
}

export async function getIncidentGroups(): Promise<{ data: IncidentGroup[] | null; error: any }> {
  const { data, error } = await supabase.from('incident_groups').select('*').order('created_at', { ascending: false });
  return { data: data as IncidentGroup[] | null, error };
}
