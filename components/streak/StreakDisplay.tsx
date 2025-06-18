// components/streak/StreakDisplay.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Flame,
  Trophy,
  Calendar,
  Snowflake,
  Star,
  Target,
  Gift,
} from "lucide-react";

interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalDaysLearned: number;
  streakFreezeCount: number;
  recentActivity: any[];
  milestones: any[];
  isOnStreak: boolean;
}

export const StreakDisplay = () => {
  const [stats, setStats] = useState<StreakStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUsingFreeze, setIsUsingFreeze] = useState(false);

  useEffect(() => {
    fetchStreakStats();
  }, []);

  const fetchStreakStats = async () => {
    try {
      const response = await fetch("/api/streak");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching streak stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const useStreakFreeze = async () => {
    if (!stats || stats.streakFreezeCount <= 0) {
      toast.error("No streak freezes available");
      return;
    }

    setIsUsingFreeze(true);
    try {
      const response = await fetch("/api/streak/freeze", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchStreakStats();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to use streak freeze");
    } finally {
      setIsUsingFreeze(false);
    }
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 100) return "🔥";
    if (streak >= 50) return "💪";
    if (streak >= 30) return "⚡";
    if (streak >= 14) return "🌟";
    if (streak >= 7) return "✨";
    if (streak >= 3) return "🎯";
    return "📅";
  };

  const getNextMilestone = (current: number) => {
    const ms = [3, 7, 14, 30, 50, 100, 365];
    return ms.find((m) => m > current) ?? null;
  };

  if (loading) {
    return (
      <Card className="shadow-lg rounded-2xl">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-300 rounded w-1/2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const nextMilestone = getNextMilestone(stats.currentStreak);
  const progress = nextMilestone
    ? (stats.currentStreak / nextMilestone) * 100
    : 100;

  return (
    <div className="space-y-6">
      {/* Main Streak Card */}
      <Card className="bg-gradient-to-r from-orange-50 to-white shadow-xl rounded-2xl border-0">
        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            {stats.isOnStreak ? (
              <Flame className="h-12 w-12 text-orange-500 animate-pulse" />
            ) : (
              <Calendar className="h-12 w-12 text-gray-400" />
            )}
            <div>
              <h3 className="text-3xl font-bold">
                {stats.currentStreak} Day Streak{" "}
                <span className="ml-2">
                  {getStreakEmoji(stats.currentStreak)}
                </span>
              </h3>
              <p className="text-gray-600">
                {stats.isOnStreak ? "Keep it up!" : "Start your streak today!"}
              </p>
            </div>
          </div>

          {/* Streak Freeze Button */}
          {stats.streakFreezeCount > 0 && (
            <Button
              onClick={useStreakFreeze}
              disabled={isUsingFreeze}
              className="mt-4 md:mt-0 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full px-4 py-2 transition-transform hover:-translate-y-1"
            >
              <Snowflake className="mr-2 h-5 w-5" />
              Freeze ({stats.streakFreezeCount})
            </Button>
          )}
        </CardContent>

        {/* Progress Bar */}
        {nextMilestone && (
          <CardContent className="pt-0 px-8 pb-8">
            <div className="flex justify-between text-sm text-gray-700 mb-2">
              <span>Progress to {nextMilestone} days</span>
              <span>
                {stats.currentStreak}/{nextMilestone}
              </span>
            </div>
            <Progress value={progress} className="h-3 rounded-full" />
          </CardContent>
        )}
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Longest Streak */}
        <Card className="transition-transform hover:-translate-y-1 hover:shadow-2xl rounded-2xl">
          <CardContent className="p-6 flex flex-col items-center">
            <Trophy className="h-8 w-8 text-yellow-500 mb-2" />
            <span className="text-3xl font-semibold">
              {stats.longestStreak}
            </span>
            <span className="text-gray-500">Longest Streak</span>
          </CardContent>
        </Card>

        {/* Total Days Learned */}
        <Card className="transition-transform hover:-translate-y-1 hover:shadow-2xl rounded-2xl">
          <CardContent className="p-6 flex flex-col items-center">
            <Target className="h-8 w-8 text-blue-500 mb-2" />
            <span className="text-3xl font-semibold">
              {stats.totalDaysLearned}
            </span>
            <span className="text-gray-500">Total Days Learned</span>
          </CardContent>
        </Card>

        {/* Streak Freezes */}
        <Card className="transition-transform hover:-translate-y-1 hover:shadow-2xl rounded-2xl">
          <CardContent className="p-6 flex flex-col items-center">
            <Snowflake className="h-8 w-8 text-cyan-500 mb-2" />
            <span className="text-3xl font-semibold">
              {stats.streakFreezeCount}
            </span>
            <span className="text-gray-500">Streak Freezes</span>
          </CardContent>
        </Card>
      </div>

      {/* Recent Milestones */}
      {stats.milestones.length > 0 && (
        <Card className="shadow-lg rounded-2xl border-0">
          <CardContent className="p-8">
            <h4 className="flex items-center text-xl font-semibold mb-4">
              <Gift className="h-6 w-6 text-green-500 mr-2" />
              Recent Achievements
            </h4>
            <div className="space-y-4">
              {stats.milestones.slice(0, 3).map((ms, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-white rounded-xl hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <Star className="h-6 w-6 text-yellow-500" />
                    <div>
                      <div className="font-medium text-gray-800">
                        {ms.streakLength} Day Milestone!
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(ms.achievedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="px-3 py-1">
                    {ms.rewardType === "XP" && `+${ms.rewardValue} XP`}
                    {ms.rewardType === "STREAK_FREEZE" &&
                      `${ms.rewardValue} Freeze`}
                    {ms.rewardType === "BADGE" && "Badge"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
