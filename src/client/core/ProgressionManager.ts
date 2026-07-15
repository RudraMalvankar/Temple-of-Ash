/**
 * LocalStorage-based progression tracking for Temple of Ash.
 * Tracks unlocked levels, completed levels, and death count.
 */

const KEYS = {
  MAX_UNLOCKED: 'toa_max_unlocked',
  COMPLETED: 'toa_completed',
  DEATHS: 'toa_deaths',
} as const;

const DEFAULT_MAX_UNLOCKED = 1;
const DEFAULT_COMPLETED: number[] = [];
const DEFAULT_DEATHS = 0;

export class ProgressionManager {
  /**
   * Get the highest unlocked level (1-8).
   */
  static getMaxUnlocked(): number {
    try {
      const value = localStorage.getItem(KEYS.MAX_UNLOCKED);
      return value ? parseInt(value, 10) : DEFAULT_MAX_UNLOCKED;
    } catch {
      return DEFAULT_MAX_UNLOCKED;
    }
  }

  /**
   * Unlock level n if it's greater than the current max.
   */
  static unlockLevel(n: number): void {
    try {
      const current = this.getMaxUnlocked();
      if (n > current) {
        localStorage.setItem(KEYS.MAX_UNLOCKED, n.toString());
      }
    } catch {
      // localStorage not available
    }
  }

  /**
   * Check if a level has been completed.
   */
  static isLevelCompleted(n: number): boolean {
    try {
      const completed = this.getCompletedLevels();
      return completed.includes(n);
    } catch {
      return false;
    }
  }

  /**
   * Mark a level as completed.
   */
  static completeLevel(n: number): void {
    try {
      const completed = this.getCompletedLevels();
      if (!completed.includes(n)) {
        completed.push(n);
        localStorage.setItem(KEYS.COMPLETED, JSON.stringify(completed));
      }
    } catch {
      // localStorage not available
    }
  }

  /**
   * Get all completed levels.
   */
  static getCompletedLevels(): number[] {
    try {
      const value = localStorage.getItem(KEYS.COMPLETED);
      return value ? JSON.parse(value) : DEFAULT_COMPLETED;
    } catch {
      return DEFAULT_COMPLETED;
    }
  }

  /**
   * Increment death counter.
   */
  static addDeath(): void {
    try {
      const current = this.getDeaths();
      localStorage.setItem(KEYS.DEATHS, (current + 1).toString());
    } catch {
      // localStorage not available
    }
  }

  /**
   * Get total deaths across all levels.
   */
  static getDeaths(): number {
    try {
      const value = localStorage.getItem(KEYS.DEATHS);
      return value ? parseInt(value, 10) : DEFAULT_DEATHS;
    } catch {
      return DEFAULT_DEATHS;
    }
  }

  /**
   * Reset all progression data.
   */
  static reset(): void {
    try {
      localStorage.removeItem(KEYS.MAX_UNLOCKED);
      localStorage.removeItem(KEYS.COMPLETED);
      localStorage.removeItem(KEYS.DEATHS);
    } catch {
      // localStorage not available
    }
  }
}