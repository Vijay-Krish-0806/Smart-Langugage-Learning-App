import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GeminiLessonGenerator } from "@/lib/gemini";
import db from "@/db/drizzle";
import { challengeProgress, challenges, lessons, units } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId, courseId } = await req.json();

    // Get lesson details to verify it belongs to the correct course
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
      with: {
        unit: true,
      },
    });

    if (!lesson || lesson.unit.courseId !== courseId) {
      return NextResponse.json(
        { error: "Invalid lesson or course" },
        { status: 400 }
      );
    }

    // Get all challenges for this specific lesson
    const lessonChallenges = await db.query.challenges.findMany({
      where: eq(challenges.lessonId, lessonId),
      with: {
        challengeProgress: {
          where: eq(challengeProgress.userId, userId),
        },
      },
    });

    // FIXED: Map results considering both attempted and correct answers
    const results = lessonChallenges.map((challenge) => {
      const progress = challenge.challengeProgress.find(
        (p) => p.userId === userId
      );
      return {
        challengeId: challenge.id,
        attempted: progress ? true : false, // Whether user attempted
        correct: progress ? progress.completed : false, // Whether answered correctly
        topic: extractTopicFromQuestion(challenge.question),
      };
    });

    // Filter only attempted challenges for analysis
    const attemptedResults = results.filter((r) => r.attempted);

    if (attemptedResults.length === 0) {
      return NextResponse.json(
        { error: "No assessment data found" },
        { status: 400 }
      );
    }

    // Pass only attempted results to analysis
    const analysisResults = attemptedResults.map((r) => ({
      challengeId: r.challengeId,
      correct: r.correct,
      topic: r.topic,
    }));

    const generator = new GeminiLessonGenerator();
    const assessmentResult = await generator.analyzeAssessmentResults(
      userId,
      courseId,
      analysisResults
    );

    return NextResponse.json({
      success: true,
      assessmentResult: {
        ...assessmentResult,
        // Add completion status for UI
        totalAttempted: attemptedResults.length,
        totalQuestions: results.length,
        fullyCompleted: attemptedResults.length === results.length,
      },
    });
  } catch (error) {
    console.error("Error analyzing assessment:", error);
    return NextResponse.json(
      { error: "Failed to analyze assessment" },
      { status: 500 }
    );
  }
}

// Helper function to extract topic from question
function extractTopicFromQuestion(question: string): string {
  const topicKeywords = {
    colors: [
      "color",
      "colour",
      "red",
      "blue",
      "green",
      "yellow",
      "black",
      "white",
    ],
    numbers: ["one", "two", "three", "four", "five", "number", "count", "zero"],
    family: [
      "father",
      "mother",
      "brother",
      "sister",
      "family",
      "parent",
      "child",
    ],
    greetings: [
      "hello",
      "goodbye",
      "good morning",
      "good evening",
      "hi",
      "bye",
    ],
    verbs: ["is", "am", "are", "have", "do", "go", "come", "eat", "drink"],
    objects: ["table", "chair", "book", "car", "house", "door", "window"],
  };

  const questionLower = question.toLowerCase();
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((keyword) => questionLower.includes(keyword))) {
      return topic;
    }
  }
  return "general";
}
