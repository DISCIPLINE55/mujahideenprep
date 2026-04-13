import { useState, useCallback } from "react";
import { getItems, setItems, generateId } from "@/lib/storage";

export function useStore<T extends { id: string }>(key: string, defaults: T[]) {
  const [items, setItemsState] = useState<T[]>(() => getItems(key, defaults));

  const refresh = useCallback(() => {
    setItemsState(getItems(key, defaults));
  }, [key, defaults]);

  const add = useCallback((item: Omit<T, "id">) => {
    const newItem = { ...item, id: generateId() } as T;
    const updated = [...items, newItem];
    setItems(key, updated);
    setItemsState(updated);
    return newItem;
  }, [items, key]);

  const update = useCallback((updated: T) => {
    const newItems = items.map((i) => (i.id === updated.id ? updated : i));
    setItems(key, newItems);
    setItemsState(newItems);
  }, [items, key]);

  const remove = useCallback((id: string) => {
    const newItems = items.filter((i) => i.id !== id);
    setItems(key, newItems);
    setItemsState(newItems);
  }, [items, key]);

  return { items, add, update, remove, refresh, setAll: (v: T[]) => { setItems(key, v); setItemsState(v); } };
}
