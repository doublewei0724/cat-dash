import { describe, expect, it, vi } from 'vitest';
import { scoreFor, worldSpeed } from '../src/config';

describe('scoring', () => {
  it('uses distance plus ten per fish', () => expect(scoreFor(742, 31)).toBe(1052));
  it('uses integers and rejects negative values', () => {
    expect(scoreFor(4.9, 2.9)).toBe(24);
    expect(() => scoreFor(-1, 0)).toThrow();
  });
});
describe('difficulty', () => {
  it('starts at 280 and reaches each phase without exceeding the cap', () => {
    expect(worldSpeed(0)).toBe(280);
    expect(worldSpeed(20)).toBe(340);
    expect(worldSpeed(45)).toBe(410);
    expect(worldSpeed(90)).toBe(482);
    expect(worldSpeed(10000)).toBe(520);
  });
});
describe('storage', () => {
  it('recovers from damaged local data and keeps only the best pending run', async () => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
    const { getSettings, storeRun, getProgress } = await import('../src/storage');
    values.set('cat-dash:settings:v1', '{broken');
    expect(getSettings().soundEnabled).toBe(true);
    storeRun({ score: 100, distanceM: 100, fishCount: 0, durationMs: 5000 });
    storeRun({ score: 50, distanceM: 50, fishCount: 0, durationMs: 5000 });
    expect(getProgress().pendingBestRun?.score).toBe(100);
    vi.unstubAllGlobals();
  });
});
