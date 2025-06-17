// app/api/ai/progress/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/db/drizzle";
import {
  challengeProgress,
  challenges,
  lessons,
  units,
  userProgress,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const courseId = parseInt(url.searchParams.get("courseId") || "0");

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID required" },
        { status: 400 }
      );
    }

    // Get user's current progress
    const userProgressData = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });

    // Get all units and lessons for the course
    const courseUnits = await db.query.units.findMany({
      where: eq(units.courseId, courseId),
      with: {
        lessons: {
          with: {
            challenges: {
              with: {
                challengeProgress: {
                  where: eq(challengeProgress.userId, userId),
                },
              },
            },
          },
        },
      },
    });

    // Calculate completion stats
    let totalLessons = 0;
    let completedLessons = 0;
    const topicPerformance: Record<string, { correct: number; total: number }> =
      {};

    courseUnits.forEach((unit) => {
      unit.lessons.forEach((lesson) => {
        totalLessons++;

        let lessonCompleted = true;
        lesson.challenges.forEach((challenge) => {
          const progress = challenge.challengeProgress.find(
            (p) => p.userId === userId
          );
          if (!progress || !progress.completed) {
            lessonCompleted = false;
          }

          // Track topic performance (simplified)
          const topic = extractTopicFromQuestion(challenge.question);
          if (!topicPerformance[topic]) {
            topicPerformance[topic] = { correct: 0, total: 0 };
          }
          topicPerformance[topic].total++;
          if (progress?.completed) {
            topicPerformance[topic].correct++;
          }
        });

        if (lessonCompleted) {
          completedLessons++;
        }
      });
    });

    // Determine skill level based on completion rate
    const completionRate =
      totalLessons > 0 ? completedLessons / totalLessons : 0;
    let skillLevel: "beginner" | "intermediate" | "advanced";

    if (completionRate < 0.3) skillLevel = "beginner";
    else if (completionRate < 0.7) skillLevel = "intermediate";
    else skillLevel = "advanced";

    // Identify strengths and weak areas
    const strengths = Object.entries(topicPerformance)
      .filter(([_, perf]) => perf.total > 0 && perf.correct / perf.total >= 0.8)
      .map(([topic]) => topic)
      .slice(0, 5);

    const weakAreas = Object.entries(topicPerformance)
      .filter(([_, perf]) => perf.total > 0 && perf.correct / perf.total < 0.5)
      .map(([topic]) => topic)
      .slice(0, 5);

    // Calculate streak (simplified - you might want to implement actual date tracking)
    const streak = Math.floor(Math.random() * 10) + 1; // Placeholder

    const progressData = {
      skillLevel,
      completedLessons,
      totalLessons,
      strengths,
      weakAreas,
      streak,
    };

    return NextResponse.json({
      success: true,
      progress: progressData,
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

// Helper function (same as before)
function extractTopicFromQuestion(question: string): string {
  const topicKeywords = {
    colors: ["color", "colour", "red", "blue", "green", "yellow"],
    numbers: ["one", "two", "three", "number", "count"],
    family: ["father", "mother", "brother", "sister", "family"],
    greetings: ["hello", "goodbye", "good morning", "good evening"],
    verbs: ["is", "am", "are", "have", "do", "go", "come"],
    objects: ["table", "chair", "book", "car", "house"],
  };

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((keyword) => question.toLowerCase().includes(keyword))) {
      return topic;
    }
  }
  return "general";
}
