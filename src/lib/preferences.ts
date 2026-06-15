import { useEffect, useState } from "react";
import { DEFAULT_MODEL_ID } from "./models";

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(`pref:${key}`));
}

function usePref<T>(key: string, fallback: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(fallback);
  useEffect(() => {
    setVal(read<T>(key, fallback));
    const handler = () => setVal(read<T>(key, fallback));
    window.addEventListener(`pref:${key}`, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(`pref:${key}`, handler);
      window.removeEventListener("storage", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = (v: T) => {
    write(key, v);
    setVal(v);
  };
  return [val, set];
}

export const useSelectedModel = () => usePref<string>("obsidian:model", DEFAULT_MODEL_ID);
export const useSidebarCollapsed = () => usePref<boolean>("obsidian:sidebar-collapsed", false);

export type Feedback = Record<string, "up" | "down">;
export const useFeedback = () => usePref<Feedback>("obsidian:feedback", {});
