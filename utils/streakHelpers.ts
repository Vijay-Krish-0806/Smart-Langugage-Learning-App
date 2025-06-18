export const streakHelpers = {
  /**
   * Calculate days between two dates
   */
  daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
  },

  /**
   * Check if a date is today
   */
  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  },

  /**
   * Check if a date is yesterday
   */
  isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  },

  /**
   * Format streak duration for display
   */
  formatStreakDuration(days: number): string {
    if (days === 0) return "No streak";
    if (days === 1) return "1 day";
    if (days < 7) return `${days} days`;
    if (days < 30)
      return `${Math.floor(days / 7)} week${
        Math.floor(days / 7) !== 1 ? "s" : ""
      }`;
    if (days < 365)
      return `${Math.floor(days / 30)} month${
        Math.floor(days / 30) !== 1 ? "s" : ""
      }`;
    return `${Math.floor(days / 365)} year${
      Math.floor(days / 365) !== 1 ? "s" : ""
    }`;
  },

  /**
   * Get streak status message
   */
  getStreakStatusMessage(currentStreak: number, isActive: boolean): string {
    if (!isActive) {
      return "Start your learning streak today!";
    }

    if (currentStreak === 1) {
      return "Great start! Keep going tomorrow.";
    }

    if (currentStreak < 7) {
      return `${currentStreak} days strong! You're building a habit.`;
    }

    if (currentStreak < 30) {
      return `${currentStreak} days! You're on fire! 🔥`;
    }

    if (currentStreak < 100) {
      return `${currentStreak} days! Incredible dedication! 💪`;
    }

    return `${currentStreak} days! You're a learning legend! 🏆`;
  },

  /**
   * Calculate next milestone
   */
  getNextMilestone(currentStreak: number): number | null {
    const milestones = [3, 7, 14, 30, 50, 100, 200, 365, 500, 1000];
    return milestones.find((m) => m > currentStreak) || null;
  },

  /**
   * Calculate progress to next milestone
   */
  getProgressToNextMilestone(currentStreak: number): {
    milestone: number | null;
    progress: number;
  } {
    const nextMilestone = this.getNextMilestone(currentStreak);
    if (!nextMilestone) {
      return { milestone: null, progress: 100 };
    }

    const previousMilestone =
      [0, 3, 7, 14, 30, 50, 100, 200, 365, 500]
        .filter((m) => m <= currentStreak)
        .pop() || 0;

    const progress =
      ((currentStreak - previousMilestone) /
        (nextMilestone - previousMilestone)) *
      100;

    return { milestone: nextMilestone, progress };
  },
};
