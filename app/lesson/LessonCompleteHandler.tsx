// components/lesson/LessonCompleteHandler.tsx
"use client";

import { useStreak } from "@/hooks/useStreak";
import { useEffect } from "react";
import { toast } from "sonner";

interface LessonCompleteHandlerProps {
  lessonId: string;
  xpEarned: number;
  timeSpent: number;
  onStreakUpdate?: (result: any) => void;
}

export const LessonCompleteHandler = ({
  lessonId,
  xpEarned,
  timeSpent,
  onStreakUpdate,
}: LessonCompleteHandlerProps) => {
  const { updateStreak } = useStreak();

  useEffect(() => {
    const handleLessonComplete = async () => {
      try {
        const result = await updateStreak({
          lessonsCompleted: 1,
          timeSpentMinutes: timeSpent,
          xpEarned: xpEarned,
        });

        if (result.streakUpdated) {
          if (result.streakBroken) {
            toast.error(
              `Streak reset to ${result.newStreak} day${
                result.newStreak !== 1 ? "s" : ""
              }. Don't give up!`
            );
          } else {
            toast.success(
              `Streak updated! ${result.newStreak} day${
                result.newStreak !== 1 ? "s" : ""
              } 🔥`
            );
          }
        }

        if (result.milestone) {
          toast.success(
            `🎉 Milestone reached! ${result.milestone.streakLength} days!`,
            {
              description: `You earned: ${result.milestone.rewardType} ${result.milestone.rewardValue}`,
              duration: 5000,
            }
          );
        }

        onStreakUpdate?.(result);
      } catch (error) {
        console.error("Failed to update streak:", error);
        toast.error("Failed to update streak");
      }
    };

    handleLessonComplete();
  }, [lessonId, xpEarned, timeSpent, updateStreak, onStreakUpdate]);

  return null; // This is a handler component, doesn't render anything
};
