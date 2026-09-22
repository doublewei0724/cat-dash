export let W = 390;
export const H = 844;
export const GROUND = 666;
export const VERSION = '0.1.0';
export let RENDER_SCALE = 1;
export const PLAYER = { gravityY: 1800, jumpVelocity: -680, maxJumps: 2 } as const;

export function setViewport(width: number, height: number): void {
  W = Math.round(width * H / Math.max(height, 1));
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  RENDER_SCALE = Math.min(4, dpr * height / H);
}

export function contentWidth(gutter = 44, max = 500): number {
  return Math.min(W - gutter, max);
}

export function worldSpeed(seconds: number): number {
  if (seconds < 20) return 280 + seconds * 3;
  if (seconds < 45) return 340 + (seconds - 20) * 2.8;
  if (seconds < 90) return 410 + (seconds - 45) * 1.6;
  return Math.min(520, 482 + (seconds - 90) * 0.25);
}

export function scoreFor(distanceM: number, fishCount: number): number {
  if (!Number.isFinite(distanceM) || !Number.isFinite(fishCount) || distanceM < 0 || fishCount < 0) throw new Error('Invalid score');
  return Math.floor(distanceM) + Math.floor(fishCount) * 10;
}

export const format = (value: number) => Math.floor(value).toLocaleString('zh-TW');
