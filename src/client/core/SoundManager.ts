/**
 * Sound manager for Temple of Ash.
 * Controls mute state, volume levels, and persists to localStorage.
 */

const STORAGE_KEYS = {
  MUTED: 'toa_muted',
  MUSIC_VOLUME: 'toa_music_volume',
  SFX_VOLUME: 'toa_sfx_volume',
} as const;

const DEFAULT_MUSIC_VOLUME = 0.7;
const DEFAULT_SFX_VOLUME = 0.8;

export class SoundManager {
  private static muted: boolean = false;
  private static musicVolume: number = DEFAULT_MUSIC_VOLUME;
  private static sfxVolume: number = DEFAULT_SFX_VOLUME;

  /**
   * Initialize sound manager from localStorage.
   */
  static init(): void {
    try {
      const mutedValue = localStorage.getItem(STORAGE_KEYS.MUTED);
      SoundManager.muted = mutedValue === 'true';

      const musicVolumeValue = localStorage.getItem(STORAGE_KEYS.MUSIC_VOLUME);
      SoundManager.musicVolume = musicVolumeValue ? parseFloat(musicVolumeValue) : DEFAULT_MUSIC_VOLUME;

      const sfxVolumeValue = localStorage.getItem(STORAGE_KEYS.SFX_VOLUME);
      SoundManager.sfxVolume = sfxVolumeValue ? parseFloat(sfxVolumeValue) : DEFAULT_SFX_VOLUME;
    } catch {
      SoundManager.muted = false;
      SoundManager.musicVolume = DEFAULT_MUSIC_VOLUME;
      SoundManager.sfxVolume = DEFAULT_SFX_VOLUME;
    }
  }

  /**
   * Check if sound is muted.
   */
  static isMuted(): boolean {
    return SoundManager.muted;
  }

  /**
   * Set mute state.
   */
  static setMuted(value: boolean): void {
    SoundManager.muted = value;
    try {
      localStorage.setItem(STORAGE_KEYS.MUTED, value.toString());
    } catch {
      // localStorage not available
    }
  }

  /**
   * Toggle mute state.
   */
  static toggleMute(): void {
    SoundManager.setMuted(!SoundManager.muted);
  }

  /**
   * Get music volume (0-1).
   */
  static getMusicVolume(): number {
    return SoundManager.musicVolume;
  }

  /**
   * Set music volume (0-1).
   */
  static setMusicVolume(value: number): void {
    SoundManager.musicVolume = Math.max(0, Math.min(1, value));
    try {
      localStorage.setItem(STORAGE_KEYS.MUSIC_VOLUME, SoundManager.musicVolume.toString());
    } catch {
      // localStorage not available
    }
  }

  /**
   * Get SFX volume (0-1).
   */
  static getSfxVolume(): number {
    return SoundManager.sfxVolume;
  }

  /**
   * Set SFX volume (0-1).
   */
  static setSfxVolume(value: number): void {
    SoundManager.sfxVolume = Math.max(0, Math.min(1, value));
    try {
      localStorage.setItem(STORAGE_KEYS.SFX_VOLUME, SoundManager.sfxVolume.toString());
    } catch {
      // localStorage not available
    }
  }

  /**
   * Reset all settings to defaults.
   */
  static resetSettings(): void {
    SoundManager.setMuted(false);
    SoundManager.setMusicVolume(DEFAULT_MUSIC_VOLUME);
    SoundManager.setSfxVolume(DEFAULT_SFX_VOLUME);
    try {
      localStorage.removeItem('toa_max_unlocked');
      localStorage.removeItem('toa_completed');
      localStorage.removeItem('toa_deaths');
    } catch {
      // localStorage not available
    }
  }
}