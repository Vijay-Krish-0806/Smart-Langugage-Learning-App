"use client";

import { useState, useEffect, useCallback } from "react";

interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalDaysLearned: number;
  streakFreezeCount: number;
  recentActivity: any[];
  milestones: any[];
  isOnStreak: boolean;
}

interface UpdateStreakParams {
  lessonsCompleted?: number;
  challengesCompleted?: number;
  timeSpentMinutes?: number;
  xpEarned?: number;
}

export const useStreak = () => {
  const [stats, setStats] = useState<StreakStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/streak");

      if (!response.ok) {
        throw new Error(`Failed to fetch streak stats: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching streak stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStreak = useCallback(
    async (params: UpdateStreakParams) => {
      try {
        const response = await fetch("/api/streak", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new Error(`Failed to update streak: ${response.status}`);
        }

        const result = await response.json();

        // Refresh stats after update
        await fetchStats();

        return result;
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error";
        console.error("Error updating streak:", err);
        throw new Error(error);
      }
    },
    [fetchStats]
  );

  const useStreakFreeze = useCallback(async () => {
    try {
      const response = await fetch("/api/streak/freeze", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Failed to use streak freeze: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Refresh stats after using freeze
        await fetchStats();
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      console.error("Error using streak freeze:", err);
      throw new Error(error);
    }
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats,
    updateStreak,
    useStreakFreeze,
  };
};
