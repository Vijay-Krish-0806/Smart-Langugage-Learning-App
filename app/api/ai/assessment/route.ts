// app/api/ai/assessment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GeminiLessonGenerator } from "@/lib/gemini";
import db from "@/db/drizzle";
import {
  courses,
  units,
  lessons,
  challenges,
  challengeOptions,
  challengeProgress,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await req.json();

    // Get course details
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if assessment already exists for this user and course
    const existingAssessmentUnit = await db.query.units.findFirst({
      where: and(
        eq(units.courseId, courseId),
        eq(units.title, `Assessment - ${course.title}`)
      ),
    });

    if (existingAssessmentUnit) {
      // Check if user has already taken this assessment
      const existingLesson = await db.query.lessons.findFirst({
        where: eq(lessons.unitId, existingAssessmentUnit.id),
      });

      if (existingLesson) {
        return NextResponse.json({
          success: true,
          lessonId: existingLesson.id,
          message: "Assessment already exists",
          alreadyExists: true,
        });
      }
    }

    const generator = new GeminiLessonGenerator();
    const assessmentLesson = await generator.generateAssessmentLesson(
      course.title
    );

    // Create assessment unit with course-specific title
    let assessmentUnit = existingAssessmentUnit;
    if (!assessmentUnit) {
      const [newUnit] = await db
        .insert(units)
        .values({
          courseId,
          title: `Assessment - ${course.title}`,
          description: `Initial assessment to determine your ${course.title} skill level`,
          order: 0,
        })
        .returning();
      assessmentUnit = newUnit;
    }

    // Create assessment lesson
    const [newLesson] = await db
      .insert(lessons)
      .values({
        unitId: assessmentUnit.id,
        title: assessmentLesson.title,
        order: 1,
      })
      .returning();

    // Create challenges and options
    for (let i = 0; i < assessmentLesson.challenges.length; i++) {
      const challenge = assessmentLesson.challenges[i];

      const [newChallenge] = await db
        .insert(challenges)
        .values({
          lessonId: newLesson.id,
          type: challenge.type,
          question: challenge.question,
          order: i + 1,
        })
        .returning();

      // Create challenge options
      for (const option of challenge.options) {
        await db.insert(challengeOptions).values({
          challengeId: newChallenge.id,
          text: option.text,
          correct: option.correct,
          imageSrc: option.imageSrc,
          audioSrc: option.audioSrc,
        });
      }
    }

    return NextResponse.json({
      success: true,
      lessonId: newLesson.id,
      message: "Assessment lesson created successfully",
      alreadyExists: false,
    });
  } catch (error) {
    console.error("Error creating assessment:", error);
    return NextResponse.json(
      { error: "Failed to create assessment lesson" },
      { status: 500 }
    );
  }
}

// GET endpoint to check if assessment exists

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

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const assessmentUnit = await db.query.units.findFirst({
      where: and(
        eq(units.courseId, courseId),
        eq(units.title, `Assessment - ${course.title}`)
      ),
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

    if (!assessmentUnit || !assessmentUnit.lessons.length) {
      return NextResponse.json({
        exists: false,
        completed: false,
      });
    }

    const lesson = assessmentUnit.lessons[0];
    const totalChallenges = lesson.challenges.length;

    // Count attempted challenges using the 'attempted' field
    const attemptedChallenges = lesson.challenges.filter((challenge) =>
      challenge.challengeProgress.some(
        (progress) => progress.userId === userId && progress.attempted
      )
    ).length;

    console.log(attemptedChallenges)

    // Count correct answers for additional info
    const correctAnswers = lesson.challenges.filter((challenge) =>
      challenge.challengeProgress.some(
        (progress) => progress.userId === userId && progress.completed
      )
    ).length;

    const isCompleted =
      totalChallenges > 0 && attemptedChallenges === totalChallenges;
    console.log(isCompleted)

    return NextResponse.json({
      exists: true,
      completed: isCompleted,
      lessonId: lesson.id,
      progress: {
        completed: attemptedChallenges,
        total: totalChallenges,
        correct: correctAnswers, // Additional info about correct answers
        accuracy:
          attemptedChallenges > 0
            ? Math.round((correctAnswers / attemptedChallenges) * 100)
            : 0,
      },
    });
  } catch (error) {
    console.error("Error checking assessment:", error);
    return NextResponse.json(
      { error: "Failed to check assessment status" },
      { status: 500 }
    );
  }
}

