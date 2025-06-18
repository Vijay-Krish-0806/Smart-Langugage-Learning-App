"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Snowflake } from "lucide-react";
import { toast } from "sonner";

interface StreakWidgetProps {
  showActions?: boolean;
  size?: "sm" | "md" | "lg";
}

export const StreakWidget = ({
  showActions = true,
  size = "md",
}: StreakWidgetProps) => {
  const [streakData, setStreakData] = useState<{
    currentStreak: number;
    streakFreezeCount: number;
    isOnStreak: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreakData();
  }, []);

  const fetchStreakData = async () => {
    try {
      const response = await fetch("/api/streak");
      if (response.ok) {
        const data = await response.json();
        setStreakData({
          currentStreak: data.currentStreak,
          streakFreezeCount: data.streakFreezeCount,
          isOnStreak: data.isOnStreak,
        });
      }
    } catch (error) {
      console.error("Error fetching streak data:", error);
    } finally {
      setLoading(false);
    }
  };

  const useStreakFreeze = async () => {
    try {
      const response = await fetch("/api/streak/freeze", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchStreakData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to use streak freeze");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 animate-pulse">
        <div className="w-6 h-6 bg-gray-300 rounded"></div>
        <div className="w-12 h-4 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (!streakData) return null;

  const iconSize =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const textSize =
    size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base";

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        <Flame
          className={`${iconSize} ${
            streakData.isOnStreak ? "text-orange-500" : "text-gray-400"
          }`}
        />
        <span className={`font-semibold ${textSize}`}>
          {streakData.currentStreak}
        </span>
      </div>

      {streakData.streakFreezeCount > 0 && showActions && (
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-blue-50"
          onClick={useStreakFreeze}
        >
          <Snowflake className="h-3 w-3 mr-1" />
          {streakData.streakFreezeCount}
        </Badge>
      )}
    </div>
  );
};
