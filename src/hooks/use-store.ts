import { useState, useCallback, useEffect } from "react";
import { getItems, setItems, generateId, KEYS } from "@/lib/storage";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

// Map local keys to Supabase tables
const KEY_TO_TABLE: Record<string, string> = {
  [KEYS.STUDENTS]: "students",
  [KEYS.TEACHERS]: "teachers",
  [KEYS.CLASSES]: "classes",
  [KEYS.SUBJECTS]: "subjects",
  [KEYS.RESULTS]: "results",
  [KEYS.PAYMENTS]: "payments",
  [KEYS.EXPENSES]: "expenses",
  [KEYS.ATTENDANCE]: "attendance",
  [KEYS.EVENTS]: "events",
  [KEYS.SETTINGS]: "settings",
  [KEYS.TIMETABLE]: "timetable",
  [KEYS.NOTIFICATIONS]: "notifications",
  [KEYS.COMMUNICATIONS]: "communications",
  [KEYS.DISCIPLINE]: "discipline",
  [KEYS.BOOKS]: "library_books",
  [KEYS.ISSUES]: "library_issues",
};

export function useStore<T extends { id: string }>(key: string, defaults: T[]) {
  const [items, setItemsState] = useState<T[]>(() => getItems(key, defaults));
  const [loading, setLoading] = useState(false);
  const tableName = KEY_TO_TABLE[key];

  const fetchCloud = useCallback(async () => {
    if (!tableName) return;
    try {
      const { data, error } = await supabase.from(tableName).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        setItems(key, data as T[]);
        setItemsState(data as T[]);
      }
    } catch (err) {
      console.error(`Fetch error for ${tableName}:`, err);
    }
  }, [key, tableName]);

  useEffect(() => {
    fetchCloud();
  }, [fetchCloud]);

  const add = useCallback(async (item: Omit<T, "id">) => {
    const newItem = { ...item, id: generateId() } as T;
    const updated = [newItem, ...items];
    
    // Update Local
    setItems(key, updated);
    setItemsState(updated);

    // Update Cloud
    if (tableName) {
      const { error } = await supabase.from(tableName).insert(newItem);
      if (error) {
        toast.error(`Cloud sync failed: ${error.message}`);
        console.error(error);
      }
    }
    return newItem;
  }, [items, key, tableName]);

  const update = useCallback(async (updated: T) => {
    const newItems = items.map((i) => (i.id === updated.id ? updated : i));
    
    // Update Local
    setItems(key, newItems);
    setItemsState(newItems);

    // Update Cloud
    if (tableName) {
      const { error } = await supabase.from(tableName).update(updated).eq("id", updated.id);
      if (error) toast.error("Cloud update failed");
    }
  }, [items, key, tableName]);

  const remove = useCallback(async (id: string) => {
    const newItems = items.filter((i) => i.id !== id);
    
    // Update Local
    setItems(key, newItems);
    setItemsState(newItems);

    // Update Cloud
    if (tableName) {
      const { error } = await supabase.from(tableName).delete().eq("id", id);
      if (error) toast.error("Cloud delete failed");
    }
  }, [items, key, tableName]);

  const syncAll = useCallback(async (newItems: T[]) => {
    // Update Local
    setItems(key, newItems);
    setItemsState(newItems);

    // Update Cloud
    if (tableName) {
      const { error } = await supabase.from(tableName).upsert(newItems);
      if (error) {
        toast.error(`Cloud bulk sync failed: ${error.message}`);
        console.error(error);
      }
    }
  }, [items, key, tableName]);

  return { 
    items, 
    add, 
    update, 
    remove, 
    loading, 
    refresh: fetchCloud, 
    syncAll,
    setAll: (v: T[]) => { setItems(key, v); setItemsState(v); } 
  };
}
