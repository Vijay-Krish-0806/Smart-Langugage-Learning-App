import db from "@/db/drizzle";
import { userStreaks, streakActivities, streakMilestones } from "@/db/schema";
import { StreakMilestone, UserStreak } from "@/types/streak";
import { eq, and, desc, gte } from "drizzle-orm";
import { sql } from "drizzle-orm";

export class StreakService {
  // Get or create user streak record
  async getUserStreak(userId: string): Promise<UserStreak> {
    let streak = await db.query.userStreaks.findFirst({
      where: eq(userStreaks.userId, userId),
    });

    if (!streak) {
      const [newStreak] = await db
        .insert(userStreaks)
        .values({
          userId,
          currentStreak: 0,
          longestStreak: 0,
          totalDaysLearned: 0,
          streakFreezeCount: 0,
        })
        .returning();
      streak = newStreak;
    }

    //@ts-ignore
    return streak;
  }

  // Update streak when user completes learning activity
  async updateStreak(
    userId: string,
    lessonsCompleted: number = 0,
    challengesCompleted: number = 0,
    timeSpentMinutes: number = 0,
    xpEarned: number = 0
  ): Promise<{
    streakUpdated: boolean;
    newStreak: number;
    streakBroken: boolean;
    milestone?: StreakMilestone;
  }> {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Get current streak
    const currentStreak = await this.getUserStreak(userId);

    // Check if user already completed learning today
    const todayActivity = await db.query.streakActivities.findFirst({
      where: and(
        eq(streakActivities.userId, userId),
        eq(streakActivities.date, todayStr)
      ),
    });

    let streakUpdated = false;
    let streakBroken = false;
    let newStreakCount = currentStreak.currentStreak;

    // Update or create today's activity
    if (todayActivity) {
      // Update existing activity
      await db
        .update(streakActivities)
        .set({
          lessonsCompleted: todayActivity.lessonsCompleted + lessonsCompleted,
          challengesCompleted:
            todayActivity.challengesCompleted + challengesCompleted,
          timeSpentMinutes: todayActivity.timeSpentMinutes + timeSpentMinutes,
          xpEarned: todayActivity.xpEarned + xpEarned,
        })
        .where(eq(streakActivities.id, todayActivity.id));
    } else {
      // Create new activity for today
      await db.insert(streakActivities).values({
        userId,
        date: todayStr,
        lessonsCompleted,
        challengesCompleted,
        timeSpentMinutes,
        xpEarned,
      });

      // Check streak logic
      const streakResult = await this.calculateStreakUpdate(
        userId,
        currentStreak,
        today
      );
      streakUpdated = streakResult.updated;
      streakBroken = streakResult.broken;
      newStreakCount = streakResult.newStreak;

      // Update user streak record
      await db
        .update(userStreaks)
        .set({
          currentStreak: newStreakCount,
          longestStreak: Math.max(currentStreak.longestStreak, newStreakCount),
          lastCompletedDate: todayStr,
          streakStartDate: streakResult.startDate,
          totalDaysLearned: currentStreak.totalDaysLearned + 1,
          updatedAt: sql`NOW()`,
        })
        .where(eq(userStreaks.userId, userId));
    }

    // Check for milestones
    const milestone = await this.checkStreakMilestones(userId, newStreakCount);

    return {
      streakUpdated,
      newStreak: newStreakCount,
      streakBroken,
      milestone,
    };
  }

  // Calculate streak update logic
  private async calculateStreakUpdate(
    userId: string,
    currentStreak: UserStreak,
    today: Date
  ): Promise<{
    updated: boolean;
    broken: boolean;
    newStreak: number;
    startDate: string;
  }> {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (!currentStreak.lastCompletedDate) {
      // First time learning
      return {
        updated: true,
        broken: false,
        newStreak: 1,
        startDate: today.toISOString().split("T")[0],
      };
    }

    const lastCompletedDate = new Date(currentStreak.lastCompletedDate);
    const daysSinceLastCompleted = Math.floor(
      (today.getTime() - lastCompletedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastCompleted === 1) {
      // Continuing streak
      return {
        updated: true,
        broken: false,
        newStreak: currentStreak.currentStreak + 1,
        startDate:
          currentStreak.streakStartDate || today.toISOString().split("T")[0],
      };
    } else if (daysSinceLastCompleted > 1) {
      // Streak broken
      return {
        updated: true,
        broken: true,
        newStreak: 1,
        startDate: today.toISOString().split("T")[0],
      };
    } else {
      // Same day, no streak update
      return {
        updated: false,
        broken: false,
        newStreak: currentStreak.currentStreak,
        startDate:
          currentStreak.streakStartDate || today.toISOString().split("T")[0],
      };
    }
  }

  // Check and award streak milestones
  private async checkStreakMilestones(
    userId: string,
    streakLength: number
  ): Promise<StreakMilestone | undefined> {
    const milestoneThresholds = [
      { days: 3, rewardType: "XP" as const, rewardValue: 50 },
      { days: 7, rewardType: "STREAK_FREEZE" as const, rewardValue: 1 },
      { days: 14, rewardType: "XP" as const, rewardValue: 200 },
      { days: 30, rewardType: "BADGE" as const, rewardValue: 1 },
      { days: 50, rewardType: "STREAK_FREEZE" as const, rewardValue: 2 },
      { days: 100, rewardType: "XP" as const, rewardValue: 1000 },
      { days: 365, rewardType: "BADGE" as const, rewardValue: 2 },
    ];

    // Find the highest milestone achieved
    const achievedMilestone = milestoneThresholds
      .filter((m) => streakLength >= m.days)
      .pop();

    if (!achievedMilestone) return undefined;

    // Check if this milestone was already awarded
    const existingMilestone = await db.query.streakMilestones.findFirst({
      where: and(
        eq(streakMilestones.userId, userId),
        eq(streakMilestones.streakLength, achievedMilestone.days)
      ),
    });

    if (existingMilestone) return undefined;

    // Create new milestone
    const [milestone] = await db
      .insert(streakMilestones)
      .values({
        userId,
        streakLength: achievedMilestone.days,
        rewardType: achievedMilestone.rewardType,
        rewardValue: achievedMilestone.rewardValue,
      })
      .returning();
    //@ts-ignore
    return milestone;
  }

  // Use streak freeze
  async useStreakFreeze(
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    const userStreak = await this.getUserStreak(userId);

    if (userStreak.streakFreezeCount <= 0) {
      return { success: false, message: "No streak freezes available" };
    }

    const today = new Date().toISOString().split("T")[0];

    // Create a "fake" activity for today to maintain streak
    await db.insert(streakActivities).values({
      userId,
      date: today,
      lessonsCompleted: 0,
      challengesCompleted: 0,
      timeSpentMinutes: 0,
      xpEarned: 0,
    });

    // Update streak freeze count
    await db
      .update(userStreaks)
      .set({
        streakFreezeCount: userStreak.streakFreezeCount - 1,
        streakFreezeUsed: true,
        lastCompletedDate: today,
        updatedAt: sql`NOW()`,
      })
      .where(eq(userStreaks.userId, userId));

    return { success: true, message: "Streak freeze used successfully!" };
  }

  // Get streak statistics
  async getStreakStats(userId: string) {
    const userStreak = await this.getUserStreak(userId);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await db.query.streakActivities.findMany({
      where: and(
        eq(streakActivities.userId, userId),
        gte(streakActivities.date, thirtyDaysAgo.toISOString().split("T")[0])
      ),
      orderBy: [desc(streakActivities.date)],
    });

    // Get milestones
    const milestones = await db.query.streakMilestones.findMany({
      where: eq(streakMilestones.userId, userId),
      orderBy: [desc(streakMilestones.achievedAt)],
    });

    return {
      currentStreak: userStreak.currentStreak,
      longestStreak: userStreak.longestStreak,
      totalDaysLearned: userStreak.totalDaysLearned,
      streakFreezeCount: userStreak.streakFreezeCount,
      recentActivity,
      milestones,
      isOnStreak: this.isStreakActive(userStreak),
    };
  }

  // Check if streak is currently active
  private isStreakActive(userStreak: UserStreak): boolean {
    if (!userStreak.lastCompletedDate) return false;

    const today = new Date();
    const lastCompleted = new Date(userStreak.lastCompletedDate);
    const daysDiff = Math.floor(
      (today.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysDiff <= 1; // Active if completed today or yesterday
  }
}
