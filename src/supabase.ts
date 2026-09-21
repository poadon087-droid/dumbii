import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface LeaderboardEntry {
  id?: string;
  player_name: string;
  score: number;
  mode: string;
  character: string;
  weapon: string;
  kills: number;
  waves: number;
  coins_earned?: number;
  daily_seed?: number | null;
  created_at?: string;
}

export interface PlayerProfile {
  player_name: string;
  total_coins: number;
  lifetime_coins: number;
  total_runs: number;
  total_kills: number;
  high_score: number;
  unlocked_weapons?: string[];
  achievements?: string[];
  updated_at?: string;
}

export interface CoinTransaction {
  id?: string;
  player_name: string;
  amount: number;
  source: string;
  description: string;
  created_at?: string;
}

const STORAGE_URL_KEY = 'rubberRequiemSupabaseUrl';
const STORAGE_ANON_KEY = 'rubberRequiemSupabaseKey';
const STORAGE_NICKNAME_KEY = 'rubberRequiemNickname';
const STORAGE_LOCAL_SCORES_KEY = 'rubberRequiemLocalScores';
const STORAGE_PROFILE_KEY = 'rubberRequiemProfile';
const STORAGE_COIN_HISTORY_KEY = 'rubberRequiemCoinHistory';

// Publishable keys are safe for a browser client. Never use the Supabase secret
// key here: Vite bundles this module into the publicly downloadable game.
export const DEFAULT_KEY = 'sb_publishable_SdRX5mLyGjlZ-Wlxqi3gGQ_TeF2UXAd';
export const DEFAULT_URL = 'https://hiswzzwmfplipdeidlyj.supabase.co';

export function deriveSupabaseUrlFromKey(key: string): string {
  const cleaned = (key || '').trim();
  if (!cleaned) return '';
  const projectRef = cleaned
    .replace(/^sb_(?:publishable|anon|secret)_/i, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
  return projectRef ? `https://${projectRef}.supabase.co` : '';
}

export const SEED_SCORES: LeaderboardEntry[] = [
  { id: 'seed-1', player_name: 'MARLOWE#1930', score: 184500, mode: 'endless', character: 'milo', weapon: 'popper', kills: 142, waves: 18, coins_earned: 380, created_at: '2026-09-16T12:00:00Z' },
  { id: 'seed-2', player_name: 'DIXIE_DAZZLE', score: 142300, mode: 'glass', character: 'dixie', weapon: 'gatling', kills: 110, waves: 14, coins_earned: 290, created_at: '2026-09-16T12:05:00Z' },
  { id: 'seed-3', player_name: 'BARNABY_BRAWN', score: 121000, mode: 'bossrush', character: 'barnaby', weapon: 'hammer', kills: 88, waves: 12, coins_earned: 240, created_at: '2026-09-16T12:10:00Z' },
  { id: 'seed-4', player_name: 'COCO_CABARET', score: 98400, mode: 'bulletdance', character: 'coco', weapon: 'choir', kills: 74, waves: 9, coins_earned: 195, created_at: '2026-09-16T12:15:00Z' },
  { id: 'seed-5', player_name: 'RUSTY_RIVET', score: 85200, mode: 'endless', character: 'rusty', weapon: 'wrench', kills: 62, waves: 8, coins_earned: 160, created_at: '2026-09-16T12:20:00Z' },
  { id: 'seed-6', player_name: 'PORBO_TRADER', score: 71000, mode: 'daily', character: 'milo', weapon: 'yoyo', kills: 53, waves: 7, coins_earned: 140, daily_seed: 8492, created_at: '2026-09-16T12:25:00Z' },
];

export function getSupabaseConfig() {
  const env = (import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }).env;
  const envUrl = env?.VITE_SUPABASE_URL || '';
  const envKey = env?.VITE_SUPABASE_PUBLISHABLE_KEY || env?.VITE_SUPABASE_ANON_KEY || '';
  const localUrl = localStorage.getItem(STORAGE_URL_KEY) || '';
  const localKey = localStorage.getItem(STORAGE_ANON_KEY) || '';
  const key = (localKey || envKey || DEFAULT_KEY).trim();
  const url = (localUrl || envUrl || DEFAULT_URL).trim();
  return { url, key };
}

export function saveSupabaseConfig(url: string, key?: string) {
  const normalizedKey = (key || '').trim();
  // A Supabase key does not contain the project URL. Keep the configured
  // project as the fallback instead of constructing a non-existent hostname.
  const normalizedUrl = (url || '').trim() || DEFAULT_URL;
  if (normalizedUrl) localStorage.setItem(STORAGE_URL_KEY, normalizedUrl);
  if (normalizedKey) localStorage.setItem(STORAGE_ANON_KEY, normalizedKey);
  _client = null;
}

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  try {
    _client = createClient(url, key);
    return _client;
  } catch (err) {
    console.error('supabase init error', err);
    return null;
  }
}

export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return { ok: false, message: 'Supabase URL or Key is missing.' };
  }
  const client = getSupabase();
  if (!client) {
    return { ok: false, message: 'Failed to initialize Supabase client.' };
  }
  try {
    const { error } = await client.from('leaderboards').select('id').limit(1);
    if (error) {
      return { ok: false, message: `Database replied: ${error.message} (Code: ${error.code || 'unknown'})` };
    }
    return { ok: true, message: 'Connected successfully to Supabase!' };
  } catch (err: any) {
    return { ok: false, message: `Network/Host error: ${err?.message || 'Could not reach server'}` };
  }
}

export function getPlayerNickname(): string {
  const stored = localStorage.getItem(STORAGE_NICKNAME_KEY);
  if (stored && stored.trim()) return stored.trim();
  const randomTag = 'MILO#' + Math.floor(1000 + Math.random() * 9000);
  localStorage.setItem(STORAGE_NICKNAME_KEY, randomTag);
  return randomTag;
}

export function setPlayerNickname(name: string) {
  const clean = name.trim().slice(0, 16) || 'MILO';
  localStorage.setItem(STORAGE_NICKNAME_KEY, clean);
}

// ── LOCAL STORAGE HELPERS ──────────────────────────────────────────────────

function getLocalScores(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_LOCAL_SCORES_KEY);
    if (!raw) return [...SEED_SCORES];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return [...SEED_SCORES];
  } catch {
    return [...SEED_SCORES];
  }
}

function saveLocalScore(entry: LeaderboardEntry) {
  try {
    const scores = getLocalScores();
    scores.unshift(entry);
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem(STORAGE_LOCAL_SCORES_KEY, JSON.stringify(scores.slice(0, 100)));
  } catch (err) {
    console.error('Save local score error:', err);
  }
}

export function getLocalProfile(): PlayerProfile {
  const name = getPlayerNickname();
  try {
    const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.total_coins === 'number') {
        return {
          player_name: name,
          total_coins: parsed.total_coins ?? 0,
          lifetime_coins: parsed.lifetime_coins ?? parsed.total_coins ?? 0,
          total_runs: parsed.total_runs ?? 0,
          total_kills: parsed.total_kills ?? 0,
          high_score: parsed.high_score ?? 0,
          unlocked_weapons: parsed.unlocked_weapons || [],
          achievements: parsed.achievements || [],
          updated_at: parsed.updated_at || new Date().toISOString(),
        };
      }
    }
  } catch {
    // fallback
  }
  return {
    player_name: name,
    total_coins: 50,
    lifetime_coins: 50,
    total_runs: 0,
    total_kills: 0,
    high_score: 0,
    unlocked_weapons: [],
    achievements: [],
    updated_at: new Date().toISOString(),
  };
}

export function saveLocalProfile(profile: PlayerProfile) {
  try {
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Save local profile error:', err);
  }
}

export function getLocalCoinHistory(): CoinTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_COIN_HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [
    { id: 'seed-tx-1', player_name: getPlayerNickname(), amount: 50, source: 'starter_grant', description: 'Porbo Welcome Grant · Starter Pouch', created_at: new Date(Date.now() - 3600000).toISOString() }
  ];
}

export function saveLocalCoinHistory(history: CoinTransaction[]) {
  try {
    localStorage.setItem(STORAGE_COIN_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch (err) {
    console.error('Save local coin history error:', err);
  }
}

// ── LEADERBOARDS ───────────────────────────────────────────────────────────

export async function submitScore(entry: Omit<LeaderboardEntry, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> {
  const newEntry: LeaderboardEntry = {
    ...entry,
    id: 'local-' + Date.now(),
    created_at: new Date().toISOString(),
  };
  saveLocalScore(newEntry);

  const client = getSupabase();
  if (client) {
    try {
      const { error } = await client.from('leaderboards').insert([
        {
          player_name: entry.player_name.slice(0, 18),
          score: entry.score,
          mode: entry.mode,
          character: entry.character,
          weapon: entry.weapon,
          kills: entry.kills,
          waves: entry.waves,
          coins_earned: entry.coins_earned || 0,
          daily_seed: entry.daily_seed || null,
        },
      ]);
      if (error) {
        console.warn('Remote Supabase notice:', error.message);
        return { success: true, error: error.message };
      }
    } catch (err: any) {
      console.warn('Remote Supabase exception:', err);
      return { success: true, error: err?.message };
    }
  }
  return { success: true };
}

export async function fetchTopScores(mode: string = 'all', dailySeed?: number, limit: number = 25): Promise<{ data: LeaderboardEntry[]; error?: string }> {
  const client = getSupabase();
  if (client) {
    try {
      let query = client.from('leaderboards').select('*').order('score', { ascending: false }).limit(limit);
      if (dailySeed !== undefined && dailySeed !== null) {
        query = query.eq('daily_seed', dailySeed);
      } else if (mode && mode !== 'all') {
        query = query.eq('mode', mode);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) return { data: data as LeaderboardEntry[] };
      if (error) console.warn('Supabase query error:', error.message);
    } catch (err) {
      console.warn('Supabase fallback:', err);
    }
  }
  let list = getLocalScores();
  if (dailySeed !== undefined && dailySeed !== null) {
    list = list.filter((s) => s.daily_seed === dailySeed || s.mode === 'daily');
  } else if (mode && mode !== 'all') {
    list = list.filter((s) => s.mode === mode);
  }
  list.sort((a, b) => b.score - a.score);
  return { data: list.slice(0, limit) };
}

// ── PLAYER PROFILE & COINS ─────────────────────────────────────────────────

export async function getPlayerProfile(playerName?: string): Promise<PlayerProfile> {
  const name = playerName || getPlayerNickname();
  const localProf = getLocalProfile();
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('player_profiles')
        .select('*')
        .eq('player_name', name)
        .maybeSingle();

      if (!error && data) {
        const merged: PlayerProfile = {
          player_name: name,
          total_coins: Number(data.total_coins ?? localProf.total_coins),
          lifetime_coins: Number(data.lifetime_coins ?? localProf.lifetime_coins),
          total_runs: Number(data.total_runs ?? localProf.total_runs),
          total_kills: Number(data.total_kills ?? localProf.total_kills),
          high_score: Number(data.high_score ?? localProf.high_score),
          unlocked_weapons: data.unlocked_weapons || localProf.unlocked_weapons,
          achievements: data.achievements || localProf.achievements,
          updated_at: data.updated_at || new Date().toISOString(),
        };
        saveLocalProfile(merged);
        return merged;
      }
    } catch (err) {
      console.warn('Supabase profile fetch error:', err);
    }
  }
  return localProf;
}

export async function savePlayerProfile(profile: Partial<PlayerProfile>): Promise<PlayerProfile> {
  const current = getLocalProfile();
  const updated: PlayerProfile = {
    ...current,
    ...profile,
    player_name: profile.player_name || current.player_name,
    updated_at: new Date().toISOString(),
  };
  saveLocalProfile(updated);

  const client = getSupabase();
  if (client) {
    try {
      await client.from('player_profiles').upsert([
        {
          player_name: updated.player_name,
          total_coins: updated.total_coins,
          lifetime_coins: updated.lifetime_coins,
          total_runs: updated.total_runs,
          total_kills: updated.total_kills,
          high_score: updated.high_score,
          unlocked_weapons: updated.unlocked_weapons,
          achievements: updated.achievements,
          updated_at: updated.updated_at,
        },
      ]);
    } catch (err) {
      console.warn('Supabase profile save error:', err);
    }
  }
  return updated;
}

export async function addCoinTransaction(tx: Omit<CoinTransaction, 'id' | 'created_at'>): Promise<void> {
  const newTx: CoinTransaction = {
    ...tx,
    id: 'tx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    created_at: new Date().toISOString(),
  };
  const history = getLocalCoinHistory();
  history.unshift(newTx);
  saveLocalCoinHistory(history);

  const client = getSupabase();
  if (client) {
    try {
      await client.from('coin_history').insert([
        {
          player_name: tx.player_name,
          amount: tx.amount,
          source: tx.source,
          description: tx.description,
        },
      ]);
    } catch (err) {
      console.warn('Supabase coin tx error:', err);
    }
  }
}

export async function getCoinHistory(playerName?: string, limit: number = 20): Promise<CoinTransaction[]> {
  const name = playerName || getPlayerNickname();
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('coin_history')
        .select('*')
        .eq('player_name', name)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        saveLocalCoinHistory(data as CoinTransaction[]);
        return data as CoinTransaction[];
      }
    } catch (err) {
      console.warn('Supabase coin history fetch error:', err);
    }
  }
  return getLocalCoinHistory().slice(0, limit);
}

export async function bankRunCoins(runData: {
  playerName?: string;
  runCoins: number;
  kills: number;
  score: number;
  mode: string;
  waves: number;
}): Promise<{ totalCoins: number; lifetimeCoins: number }> {
  const name = runData.playerName || getPlayerNickname();
  const currentProfile = getLocalProfile();
  const coinsEarned = Math.max(0, runData.runCoins);

  const newTotal = (currentProfile.total_coins || 0) + coinsEarned;
  const newLifetime = (currentProfile.lifetime_coins || 0) + coinsEarned;
  const newRuns = (currentProfile.total_runs || 0) + 1;
  const newKills = (currentProfile.total_kills || 0) + runData.kills;
  const newHighScore = Math.max(currentProfile.high_score || 0, runData.score);

  const updatedProfile: PlayerProfile = {
    ...currentProfile,
    player_name: name,
    total_coins: newTotal,
    lifetime_coins: newLifetime,
    total_runs: newRuns,
    total_kills: newKills,
    high_score: newHighScore,
    updated_at: new Date().toISOString(),
  };

  saveLocalProfile(updatedProfile);

  if (coinsEarned > 0) {
    await addCoinTransaction({
      player_name: name,
      amount: coinsEarned,
      source: 'run_loot',
      description: `Banked from ${runData.mode.toUpperCase()} run (${runData.waves} waves, ${runData.kills} KOs)`,
    });
  }

  const client = getSupabase();
  if (client) {
    try {
      await client.from('player_profiles').upsert([
        {
          player_name: name,
          total_coins: newTotal,
          lifetime_coins: newLifetime,
          total_runs: newRuns,
          total_kills: newKills,
          high_score: newHighScore,
          updated_at: updatedProfile.updated_at,
        },
      ]);
    } catch (err) {
      console.warn('Supabase profile sync error:', err);
    }
  }

  return { totalCoins: newTotal, lifetimeCoins: newLifetime };
}
