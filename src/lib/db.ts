import { supabase } from './supabaseClient';

/**
 * Fetch all rows from a Supabase table.
 * Returns empty array on error (graceful offline).
 */
export async function fetchAll<T>(table: string, orderBy?: string): Promise<T[]> {
  try {
    let query = supabase.from(table).select("*");
    if (orderBy) query = query.order(orderBy, { ascending: true });
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as T[];
  } catch (err) {
    console.warn(`fetchAll(${table}) failed:`, err);
    return [];
  }
}

export async function fetchFromSupabase<T>(table: string): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw error;
  return data as T[];
}

export async function saveToSupabase<T>(table: string, item: T) {
  const { error } = await supabase.from(table).upsert(item as any);
  if (error) throw error;
}

export async function deleteFromSupabase(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

/** Push localStorage caches up to Supabase for each mapped table. */
export async function syncLocalToCloud(
  keysToTables: Record<string, string>
): Promise<{ synced: string[]; failed: string[] }> {
  const synced: string[] = [];
  const failed: string[] = [];
  for (const [key, table] of Object.entries(keysToTables)) {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (!raw) { synced.push(table); continue; }
      const parsed = JSON.parse(raw);
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      if (rows.length === 0) { synced.push(table); continue; }
      const { error } = await supabase.from(table).upsert(rows as any);
      if (error) throw error;
      synced.push(table);
    } catch (err) {
      console.error(`syncLocalToCloud(${table}) failed:`, err);
      failed.push(table);
    }
  }
  return { synced, failed };
}
