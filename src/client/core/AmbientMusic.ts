/**
 * Ambient music system for Temple of Ash.
 * Procedural low drone with filter sweep using Web Audio API.
 */

import { SoundManager } from './SoundManager';

export class AmbientMusic {
  private static context: AudioContext | null = null;
  private static droneOsc: OscillatorNode | null = null;
  private static filter: BiquadFilterNode | null = null;
  private static gain: GainNode | null = null;
  private static lfo: OscillatorNode | null = null;
  private static lfoGain: GainNode | null = null;
  private static isPlaying = false;

  /**
   * Start ambient music.
   */
  static start(): void {
    if (AmbientMusic.isPlaying) return;
    if (SoundManager.isMuted()) return;

    try {
      AmbientMusic.context = new AudioContext();
      const ctx = AmbientMusic.context;

      // Create drone oscillator
      AmbientMusic.droneOsc = ctx.createOscillator();
      AmbientMusic.droneOsc.type = 'sine';
      AmbientMusic.droneOsc.frequency.value = 55; // Low A

      // Create filter for timbre
      AmbientMusic.filter = ctx.createBiquadFilter();
      AmbientMusic.filter.type = 'lowpass';
      AmbientMusic.filter.frequency.value = 200;
      AmbientMusic.filter.Q.value = 1;

      // Create gain node
      AmbientMusic.gain = ctx.createGain();
      AmbientMusic.gain.gain.value = 0.15 * SoundManager.getMusicVolume();

      // Create LFO for filter sweep
      AmbientMusic.lfo = ctx.createOscillator();
      AmbientMusic.lfo.type = 'sine';
      AmbientMusic.lfo.frequency.value = 0.1; // Very slow sweep

      AmbientMusic.lfoGain = ctx.createGain();
      AmbientMusic.lfoGain.gain.value = 100; // Sweep range

      // Connect nodes
      AmbientMusic.droneOsc.connect(AmbientMusic.filter);
      AmbientMusic.filter.connect(AmbientMusic.gain);
      AmbientMusic.gain.connect(ctx.destination);

      AmbientMusic.lfo.connect(AmbientMusic.lfoGain);
      AmbientMusic.lfoGain.connect(AmbientMusic.filter.frequency);

      // Start oscillators
      AmbientMusic.droneOsc.start();
      AmbientMusic.lfo.start();

      AmbientMusic.isPlaying = true;
    } catch {
      // AudioContext not available
    }
  }

  /**
   * Stop ambient music.
   */
  static stop(): void {
    if (!AmbientMusic.isPlaying) return;

    try {
      AmbientMusic.droneOsc?.stop();
      AmbientMusic.lfo?.stop();
      void AmbientMusic.context?.close();
    } catch {
      // Ignore errors on cleanup
    }

    AmbientMusic.droneOsc = null;
    AmbientMusic.filter = null;
    AmbientMusic.gain = null;
    AmbientMusic.lfo = null;
    AmbientMusic.lfoGain = null;
    AmbientMusic.context = null;
    AmbientMusic.isPlaying = false;
  }

  /**
   * Check if music is playing.
   */
  static getIsPlaying(): boolean {
    return AmbientMusic.isPlaying;
  }

  /**
   * Update music volume.
   */
  static updateVolume(): void {
    if (AmbientMusic.gain) {
      AmbientMusic.gain.gain.value = 0.15 * SoundManager.getMusicVolume();
    }
  }
}