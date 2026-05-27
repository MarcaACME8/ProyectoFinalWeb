import { useCallback, useEffect, useMemo, useState } from 'react';
import { createIncidentGroupWithIncidents, getAdminIncidentsWithGroups, updateIncidentGroupStatus } from '../services/incidentGroups';
import type { Incident } from '../types';

export function useAdminIncidentGroups() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getAdminIncidentsWithGroups();
    if (!error && data) {
      setIncidents(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);
  const selectedCount = selectedIds.length;

  const toggleSelection = (id: string) => setSelected((current) => ({ ...current, [id]: !current[id] }));
  const clearSelection = () => setSelected({});

  const createGroup = async (title: string, description: string) => {
    if (selectedIds.length < 2) {
      return { error: new Error('Selecciona al menos 2 incidentes para crear un grupo') };
    }

    setSaving(true);
    const { data, error } = await createIncidentGroupWithIncidents(title, description, selectedIds);
    if (!error) {
      await fetchIncidents();
      clearSelection();
    }
    setSaving(false);
    return { data, error };
  };

  const syncGroupStatus = async (groupId: string, status: Incident['estado']) => {
    setSaving(true);
    const { data, error } = await updateIncidentGroupStatus(groupId, status);
    if (!error) {
      await fetchIncidents();
    }
    setSaving(false);
    return { data, error };
  };

  return {
    incidents,
    loading,
    saving,
    selected,
    selectedCount,
    selectedIds,
    toggleSelection,
    clearSelection,
    fetchIncidents,
    createGroup,
    syncGroupStatus
  };
}
