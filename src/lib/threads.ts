import type { UIMessage } from "ai";

export type Thread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
  pinned?: boolean;
};

const KEY = "perplexity-threads";
const EVT = "perplexity-threads-updated";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadThreads(): Thread[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Thread[];
    return Array.isArray(arr) ? arr.sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch {
    return [];
  }
}

function persist(threads: Thread[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(threads));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function saveThread(thread: Thread) {
  const all = loadThreads();
  const idx = all.findIndex((t) => t.id === thread.id);
  if (idx >= 0) all[idx] = thread;
  else all.unshift(thread);
  persist(all);
}

export function deleteThread(id: string) {
  persist(loadThreads().filter((t) => t.id !== id));
}

export function deleteAllThreads() {
  persist([]);
}

export function getThread(id: string): Thread | null {
  return loadThreads().find((t) => t.id === id) ?? null;
}

export function renameThread(id: string, title: string) {
  const all = loadThreads();
  const t = all.find((x) => x.id === id);
  if (!t) return;
  t.title = title.trim() || "New Thread";
  persist(all);
}

export function togglePin(id: string) {
  const all = loadThreads();
  const t = all.find((x) => x.id === id);
  if (!t) return;
  t.pinned = !t.pinned;
  persist(all);
}

export function exportThreadMarkdown(t: Thread): string {
  const lines = [`# ${t.title}`, ""];
  for (const m of t.messages) {
    const role = m.role === "user" ? "**You**" : "**Obsidian**";
    const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
    lines.push(role, "", text, "", "---", "");
  }
  return lines.join("\n");
}

export function downloadAllThreadsJSON() {
  if (!isBrowser()) return;
  const blob = new Blob([JSON.stringify(loadThreads(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `obsidian-threads-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadThreadMarkdown(t: Thread) {
  if (!isBrowser()) return;
  const blob = new Blob([exportThreadMarkdown(t)], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${t.title.replace(/[^a-z0-9-_]+/gi, "-").slice(0, 40) || "thread"}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function createThread(): Thread {
  const id =
    isBrowser() && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  const thread: Thread = { id, title: "New Thread", updatedAt: Date.now(), messages: [] };
  saveThread(thread);
  return thread;
}

export function subscribeThreads(cb: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function deriveTitle(messages: UIMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New Thread";
  const text = first.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .trim();
  if (!text) return "New Thread";
  const words = text.split(/\s+/).slice(0, 7).join(" ");
  return words.length > 60 ? words.slice(0, 60) + "…" : words;
}

export function groupByDate(threads: Thread[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86_400_000;
  const sevenDaysAgo = startOfToday - 7 * 86_400_000;

  const groups: Record<string, Thread[]> = { Today: [], Yesterday: [], "Previous 7 days": [], Older: [] };
  for (const t of threads) {
    if (t.updatedAt >= startOfToday) groups.Today.push(t);
    else if (t.updatedAt >= startOfYesterday) groups.Yesterday.push(t);
    else if (t.updatedAt >= sevenDaysAgo) groups["Previous 7 days"].push(t);
    else groups.Older.push(t);
  }
  return groups;
}
