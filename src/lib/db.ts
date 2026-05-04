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
  const { error } = await supabase.from(table).upsert(item);
  if (error) throw error;
}

export async function deleteFromSupabase(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}
