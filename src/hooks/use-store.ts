import { useState, useCallback, useEffect } from "react";
import { getItems, setItems, generateId, KEYS, fetchTableDeduplicated } from "@/lib/storage";
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

  const fetchCloud = useCallback(async (force = false) => {
    if (!tableName) return;

    // Check cache expiration (30 seconds TTL)
    const cacheKey = `mpsms_last_fetch_${tableName}`;
    const lastFetch = localStorage.getItem(cacheKey);
    if (!force && lastFetch && Date.now() - parseInt(lastFetch) < 30000) {
      return;
    }

    try {
      const { data, error } = await fetchTableDeduplicated(tableName);
      if (error) throw error;

      // Update cache timestamp
      localStorage.setItem(cacheKey, Date.now().toString());

      if (data && data.length > 0) {
        // Sort client-side to ensure newer items display at top
        const sortedData = [...data].sort((a: any, b: any) => {
          if (a.created_at && b.created_at) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return 0;
        });
        setItems(key, sortedData as T[], false);
        setItemsState(sortedData as T[]);
      } else if (defaults && defaults.length > 0) {
        const { error: seedErr } = await supabase.from(tableName).insert(defaults);
        if (seedErr) {
          console.warn(`Seeding failed for ${tableName}:`, seedErr);
        } else {
          setItems(key, defaults, false);
          setItemsState(defaults);
        }
      }
    } catch (err) {
      console.error(`Fetch error for ${tableName}:`, err);
    }
  }, [key, tableName, defaults]);

  useEffect(() => {
    fetchCloud();
  }, [fetchCloud]);

  useEffect(() => {
    if (!tableName) return;

    // Subscribe to Postgres changes for this table in real-time
    const channel = supabase
      .channel(`realtime-store-${tableName}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        (payload: any) => {
          const eventType = payload.eventType;
          const newRow = payload.new;
          const oldRow = payload.old;

          if (!eventType) return;

          setItemsState((prevItems) => {
            let updatedItems = [...prevItems];
            if (eventType === "INSERT") {
              if (newRow && !updatedItems.some((item) => item.id === newRow.id)) {
                updatedItems = [newRow as T, ...updatedItems];
              }
            } else if (eventType === "UPDATE") {
              if (newRow) {
                updatedItems = updatedItems.map((item) =>
                  item.id === newRow.id ? { ...item, ...newRow } : item
                );
              }
            } else if (eventType === "DELETE") {
              if (oldRow && oldRow.id) {
                updatedItems = updatedItems.filter((item) => item.id !== oldRow.id);
              }
            }

            // Client-side sort to keep descending order by created_at if available
            updatedItems.sort((a: any, b: any) => {
              if (a.created_at && b.created_at) {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              }
              return 0;
            });

            // Update localStorage cache synchronously
            setItems(key, updatedItems, false);
            return updatedItems;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, key]);

  const add = useCallback(async (item: Omit<T, "id">) => {
    const newItem = { ...item, id: generateId() } as T;
    const updated = [newItem, ...items];
    
    // Update Local
    setItems(key, updated, false);
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
    setItems(key, newItems, false);
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
    setItems(key, newItems, false);
    setItemsState(newItems);

    // Update Cloud
    if (tableName) {
      const { error } = await supabase.from(tableName).delete().eq("id", id);
      if (error) toast.error("Cloud delete failed");
    }
  }, [items, key, tableName]);

  const syncAll = useCallback(async (newItems: T[]) => {
    // Update Local
    setItems(key, newItems, false);
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
    refresh: () => fetchCloud(true), 
    syncAll,
    setAll: (v: T[]) => { setItems(key, v, false); setItemsState(v); } 
  };
}
