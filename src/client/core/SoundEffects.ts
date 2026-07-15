import type { Scene } from 'phaser';
import { SoundManager } from './SoundManager';

type SoundContext = {
  context: AudioContext;
  volume: number;
};

function hasContext(sound: unknown): sound is { context: AudioContext } {
  return !!sound && typeof sound === 'object' && 'context' in sound;
}

export class SoundEffects {
  static playClick(scene: Scene): void {
    const soundCtx = SoundEffects.getSoundContext(scene);
    if (!soundCtx) return;

    const { context: ctx, volume } = soundCtx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);

    gain.gain.setValueAtTime(0.2 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  static playPush(scene: Scene): void {
    const soundCtx = SoundEffects.getSoundContext(scene);
    if (!soundCtx) return;

    const { context: ctx, volume } = soundCtx;
    const now = ctx.currentTime;
    const duration = 0.2;
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const channel = noiseBuffer.getChannelData(0);

    for (let i = 0; i < channel.length; i++) {
      const t = i / ctx.sampleRate;
      channel[i] = (Math.random() * 2 - 1) * Math.exp(-8 * t);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 350;
    filter.Q.value = 1.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  }

  static playDoor(scene: Scene): void {
    const soundCtx = SoundEffects.getSoundContext(scene);
    if (!soundCtx) return;

    const { context: ctx, volume } = soundCtx;
    const now = ctx.currentTime;
    const duration = 0.4;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(60, now + duration);

    gain.gain.setValueAtTime(0.15 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  static playCheckpoint(scene: Scene): void {
    const soundCtx = SoundEffects.getSoundContext(scene);
    if (!soundCtx) return;

    const { context: ctx, volume } = soundCtx;
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, now);
    osc1.frequency.setValueAtTime(554.37, now + 0.1);
    osc1.frequency.setValueAtTime(659.25, now + 0.2);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(220, now);

    gain.gain.setValueAtTime(0.2 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  static playDeath(scene: Scene): void {
    const soundCtx = SoundEffects.getSoundContext(scene);
    if (!soundCtx) return;

    const { context: ctx, volume } = soundCtx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

    gain.gain.setValueAtTime(0.3 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  static playWin(scene: Scene): void {
    const soundCtx = SoundEffects.getSoundContext(scene);
    if (!soundCtx) return;

    const { context: ctx, volume } = soundCtx;
    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.12 * volume, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.3);
    });
  }

  static playChime(scene: Scene): void {
    const soundCtx = SoundEffects.getSoundContext(scene);
    if (!soundCtx) return;

    const { context: ctx, volume } = soundCtx;
    const now = ctx.currentTime;
    const notes = [880, 1108.73, 1318.51]; // A5, C#6, E6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.15 * volume, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.4);
    });
  }

  static playRumble(scene: Scene): void {
    const soundCtx = SoundEffects.getSoundContext(scene);
    if (!soundCtx) return;

    const { context: ctx, volume } = soundCtx;
    const now = ctx.currentTime;
    const duration = 0.3;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(40, now + duration);

    gain.gain.setValueAtTime(0.2 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  private static getSoundContext(scene: Scene): SoundContext | null {
    if (SoundManager.isMuted()) return null;
    
    const sound = scene.sound;
    if (!hasContext(sound)) return null;

    const ctx = sound.context;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    return { context: ctx, volume: SoundManager.getSfxVolume() };
  }
}
