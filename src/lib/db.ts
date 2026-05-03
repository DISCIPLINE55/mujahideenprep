import { supabase } from './supabaseClient';
import { KEYS } from './storage';

export async function syncTableToSupabase(key: string, table: string) {
  const localData = localStorage.getItem(key);
  if (!localData) return;

  const items = JSON.parse(localData);
  if (!Array.isArray(items) || items.length === 0) return;

  // Map local fields to DB fields if necessary
  // For now, we'll assume they match or use JSONB where they don't
  const { error } = await supabase.from(table).upsert(
    items.map((item: any) => ({
      ...item,
      // Ensure id is uuid if it's not already
      // but if we use string IDs, we need to ensure the DB handles them
    }))
  );

  if (error) {
    console.error(`Error syncing ${table}:`, error);
    throw error;
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
