export interface UserStreak {
  id: number;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string ; 
  streakStartDate: string ; 
  totalDaysLearned: number;
  streakFreezeUsed: boolean;
  streakFreezeCount: number;
  createdAt: string; 
  updatedAt: string; 
}

export interface StreakActivity {
  id: number;
  userId: string;
  date: string; 
  lessonsCompleted: number;
  challengesCompleted: number;
  timeSpentMinutes: number;
  xpEarned: number;
  createdAt: string; 
}

export interface StreakMilestone {
  id: number;
  userId: string;
  streakLength: number;
  achievedAt: string; 
  rewardType: "XP" | "BADGE" | "STREAK_FREEZE" | "GEMS";
  rewardValue: number;
  claimed: boolean;
}
