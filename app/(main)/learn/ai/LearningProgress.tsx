"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ProgressData {
  skillLevel: "beginner" | "intermediate" | "advanced";
  completedLessons: number;
  totalLessons: number;
  strengths: string[];
  weakAreas: string[];
  streak: number;
}

interface Props {
  progressData: any;
}

export const LearningProgress = ({ progressData }: Props) => {
  const progressPercentage =
    (progressData.correctAnswers / progressData.totalChallenges) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Your Learning Progress
          <Badge
            variant={
              progressData.skillLevel === "beginner"
                ? "secondary"
                : progressData.skillLevel === "intermediate"
                ? "default"
                : "destructive"
            }
          >
            {progressData.skillLevel}
          </Badge>
        </CardTitle>
        <CardDescription>
          AI-powered insights into your language learning journey
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Lessons Completed</span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-green-700">💪 Strengths</h4>
            <div className="space-y-1">
              {progressData.strengths.map((strength: any, index: any) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-green-700 border-green-300"
                >
                  {strength}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-orange-700">🎯 Focus Areas</h4>
            <div className="space-y-1">
              {progressData.weakAreas.map((area: any, index: any) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-orange-700 border-orange-300"
                >
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
