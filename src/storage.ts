import type { RunResult } from './supabase';

export type Settings = { musicEnabled: boolean; soundEnabled: boolean; vibrationEnabled: boolean };
export type Progress = { displayName?: string; localBestScore: number; pendingBestRun?: RunResult };
const defaults: Settings = { musicEnabled: true, soundEnabled: true, vibrationEnabled: true };

function read<T>(key: string, fallback: T): T {
  try { return { ...fallback, ...JSON.parse(localStorage.getItem(key) || '{}') } as T; } catch { return fallback; }
}
export const getSettings = (): Settings => read('cat-dash:settings:v1', defaults);
export const saveSettings = (value: Settings): void => localStorage.setItem('cat-dash:settings:v1', JSON.stringify(value));
export const getProgress = (): Progress => read('cat-dash:progress:v1', { localBestScore: 0 });
export const saveProgress = (value: Progress): void => localStorage.setItem('cat-dash:progress:v1', JSON.stringify(value));
export function storeRun(run: RunResult): boolean {
  const progress = getProgress();
  const isBest = run.score > progress.localBestScore;
  progress.localBestScore = Math.max(progress.localBestScore, run.score);
  if (!progress.pendingBestRun || run.score > progress.pendingBestRun.score) progress.pendingBestRun = run;
  saveProgress(progress);
  return isBest;
}
