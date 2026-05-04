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

/**
 * Fetch a single row by ID.
 */
export async function fetchById<T>(table: string, id: string): Promise<T | null> {
  try {
    const { data, error } = await supabase.from(table).select("*").eq("id", id).single();
    if (error) throw error;
    return data as T;
  } catch {
    return null;
  }
}

/**
 * Upsert one or more records into a Supabase table.
 */
export async function upsertRows<T>(table: string, items: T | T[]): Promise<void> {
  try {
    const rows = Array.isArray(items) ? items : [items];
    const { error } = await supabase.from(table).upsert(rows);
    if (error) throw error;
  } catch (err) {
    console.error(`upsertRows(${table}) failed:`, err);
    throw err;
  }
}

/**
 * Delete a row by ID from a Supabase table.
 */
export async function deleteRow(table: string, id: string): Promise<void> {
  try {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.error(`deleteRow(${table}, ${id}) failed:`, err);
    throw err;
  }
}

/**
 * Sync all localStorage data to Supabase (for one-time migration).
 * Reads each KEYS entry from localStorage and upserts to the corresponding table.
 */
export async function syncLocalToCloud(
  keysToTables: Record<string, string>
): Promise<{ synced: string[]; failed: string[] }> {
  const synced: string[] = [];
  const failed: string[] = [];

  for (const [key, table] of Object.entries(keysToTables)) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const items = JSON.parse(raw);
      const rows = Array.isArray(items) ? items : [items];
      if (rows.length === 0) continue;
      
      const { error } = await supabase.from(table).upsert(rows);
      if (error) {
        console.error(`Sync failed for ${table}:`, error);
        failed.push(table);
      } else {
        synced.push(table);
      }
    } catch (err) {
      console.error(`Sync exception for ${table}:`, err);
      failed.push(table);
    }
  }

  return { synced, failed };
}
