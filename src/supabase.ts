import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { VERSION } from './config';

export type RunResult = { score: number; distanceM: number; fishCount: number; durationMs: number };
export type Entry = { rank: number; displayName: string; publicCode: string; bestScore: number; achievedAt: string; isCurrentUser: boolean };
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const client: SupabaseClient | null = url && key && !url.includes('YOUR_PROJECT_REF') ? createClient(url, key) : null;
export const configured = !!client;
let online = false;
export const isOnline = (): boolean => online;

export async function getOrCreateSession(): Promise<boolean> {
  if (!client) return false;
  try {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data.session) {
      const result = await client.auth.signInAnonymously();
      if (result.error) throw result.error;
    }
    online = true;
    return true;
  } catch { online = false; return false; }
}

export async function ensureProfile(displayName: string): Promise<{ displayName: string; publicCode: string } | null> {
  if (!client || !online) return null;
  const { data: userData } = await client.auth.getUser();
  const id = userData.user?.id;
  if (!id) return null;
  const { data: existing } = await client.from('profiles').select('display_name,public_code').eq('id', id).maybeSingle();
  if (existing) return { displayName: existing.display_name, publicCode: existing.public_code };
  const { data, error } = await client.from('profiles').insert({ id, display_name: displayName }).select('display_name,public_code').single();
  if (error || !data) return null;
  return { displayName: data.display_name, publicCode: data.public_code };
}

export async function updateName(displayName: string): Promise<void> {
  if (!client || !online) return;
  const { data } = await client.auth.getUser();
  if (data.user) await client.from('profiles').update({ display_name: displayName }).eq('id', data.user.id);
}

export async function submitRun(run: RunResult): Promise<boolean> {
  if (!client || !online) return false;
  const { error } = await client.rpc('submit_game_run', {
    p_score: run.score, p_distance_m: run.distanceM, p_fish_count: run.fishCount,
    p_duration_ms: Math.max(1000, Math.min(1800000, run.durationMs)), p_client_version: VERSION
  });
  return !error;
}

function mapEntry(row: Record<string, unknown>): Entry {
  return { rank: Number(row.rank), displayName: String(row.display_name), publicCode: String(row.public_code), bestScore: Number(row.best_score), achievedAt: String(row.achieved_at), isCurrentUser: Boolean(row.is_current_user) };
}
export async function getLeaderboard(): Promise<Entry[]> {
  if (!client || !online) throw new Error('offline');
  const { data, error } = await client.rpc('get_leaderboard', { p_limit: 100 });
  if (error) throw error;
  return (data || []).map((row: Record<string, unknown>) => mapEntry(row));
}
export async function getMyRank(): Promise<Entry | null> {
  if (!client || !online) return null;
  const { data, error } = await client.rpc('get_my_rank');
  return error || !data?.[0] ? null : mapEntry(data[0]);
}
