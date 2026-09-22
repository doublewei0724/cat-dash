import { getSettings } from './storage';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!ctx) ctx = new AudioCtor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function unlockAudio(): void {
  getCtx();
}

function tone(freq: number, duration: number, opts: { type?: OscillatorType; gain?: number; sweepTo?: number } = {}): void {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, audio.currentTime);
  if (opts.sweepTo) osc.frequency.exponentialRampToValueAtTime(opts.sweepTo, audio.currentTime + duration);
  gain.gain.setValueAtTime(opts.gain ?? 0.2, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
}

function sfx(freq: number, duration: number, opts?: { type?: OscillatorType; gain?: number; sweepTo?: number }): void {
  if (!getSettings().soundEnabled) return;
  tone(freq, duration, opts);
}

export function playJump(): void { sfx(420, .15, { type: 'square', sweepTo: 640, gain: .12 }); }
export function playFish(): void {
  sfx(880, .1, { type: 'triangle', sweepTo: 1180, gain: .15 });
  setTimeout(() => sfx(1180, .08, { type: 'triangle', gain: .1 }), 60);
}
export function playHit(): void { sfx(220, .3, { type: 'sawtooth', sweepTo: 60, gain: .18 }); }
export function playClick(): void { sfx(500, .06, { type: 'square', gain: .08 }); }

export function vibrate(pattern: number | number[]): void {
  if (!getSettings().vibrationEnabled) return;
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
}

const MUSIC_NOTES = [523.25, 659.25, 783.99, 659.25, 523.25, 392.0, 523.25, 659.25];
let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicStep = 0;

export function startMusic(): void {
  if (musicTimer !== null) return;
  musicTimer = setInterval(() => {
    if (!getSettings().musicEnabled) return;
    tone(MUSIC_NOTES[musicStep % MUSIC_NOTES.length], .22, { type: 'sine', gain: .05 });
    musicStep++;
  }, 260);
}

export function stopMusic(): void {
  if (musicTimer !== null) { clearInterval(musicTimer); musicTimer = null; musicStep = 0; }
}
