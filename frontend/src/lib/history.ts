// History storage helpers
import { storage } from "@/src/utils/storage";

export type HistoryEntry = {
  id: string;
  timestamp: number;
  op: string; // operation name e.g. "multiply_matrix"
  summary: string; // short label, e.g. "2x2 × 2x2"
  inputs: Record<string, unknown>;
  result: unknown;
};

const KEY = "calc_history_v1";
const MAX = 50;

export async function loadHistory(): Promise<HistoryEntry[]> {
  const raw = await storage.getItem<string>(KEY, "");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export async function saveHistoryEntry(entry: HistoryEntry): Promise<void> {
  const list = await loadHistory();
  const next = [entry, ...list].slice(0, MAX);
  await storage.setItem(KEY, JSON.stringify(next));
}

export async function clearHistory(): Promise<void> {
  await storage.setItem(KEY, JSON.stringify([]));
}
