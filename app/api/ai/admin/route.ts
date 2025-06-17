// app/api/admin/generate-lessons/route.ts
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
} from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Add admin check here if needed
    // const isAdmin = await checkAdminStatus(userId);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    const { courseId, lessonCount, difficulty, topics } = await req.json();

    // Get course details
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const generator = new GeminiLessonGenerator();

    // Create a mock assessment result for admin generation
    const mockAssessmentResult = {
      userId: "admin",
      courseId,
      totalChallenges: 15,
      correctAnswers:
        difficulty === "beginner" ? 5 : difficulty === "intermediate" ? 10 : 13,
      skillLevel: difficulty as "beginner" | "intermediate" | "advanced",
      weakAreas:
        topics.length > 0 ? topics.slice(0, 3) : ["vocabulary", "grammar"],
      strengths: [],
      recommendedTopics:
        topics.length > 0
          ? topics
          : ["basic-conversation", "numbers", "colors"],
    };

    const generatedUnits = await generator.generatePersonalizedUnits(
      course.title,
      mockAssessmentResult,
      lessonCount
    );

    // Get the highest order number for existing units
    const existingUnits = await db.query.units.findMany({
      where: eq(units.courseId, courseId),
      orderBy: (units, { desc }) => [desc(units.order)],
    });

    let nextUnitOrder =
      existingUnits.length > 0 ? existingUnits[0].order + 1 : 1;
    let totalLessonsCreated = 0;

    // Create units, lessons, and challenges
    for (const unitData of generatedUnits) {
      // Create unit
      const [newUnit] = await db
        .insert(units)
        .values({
          courseId,
          title: unitData.title,
          description: unitData.description,
          order: nextUnitOrder++,
        })
        .returning();

      // Create lessons for this unit
      for (
        let lessonIndex = 0;
        lessonIndex < unitData.lessons.length;
        lessonIndex++
      ) {
        const lessonData = unitData.lessons[lessonIndex];

        const [newLesson] = await db
          .insert(lessons)
          .values({
            unitId: newUnit.id,
            title: lessonData.title,
            order: lessonIndex + 1,
          })
          .returning();

        totalLessonsCreated++;

        // Create challenges for this lesson
        for (
          let challengeIndex = 0;
          challengeIndex < lessonData.challenges.length;
          challengeIndex++
        ) {
          const challengeData = lessonData.challenges[challengeIndex];

          const [newChallenge] = await db
            .insert(challenges)
            .values({
              lessonId: newLesson.id,
              type: challengeData.type,
              question: challengeData.question,
              order: challengeIndex + 1,
            })
            .returning();

          // Create challenge options
          for (const option of challengeData.options) {
            await db.insert(challengeOptions).values({
              challengeId: newChallenge.id,
              text: option.text,
              correct: option.correct,
              imageSrc: option.imageSrc,
              audioSrc: option.audioSrc,
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      unitsCreated: generatedUnits.length,
      lessonsCreated: totalLessonsCreated,
      message: "Lessons generated successfully",
    });
  } catch (error) {
    console.error("Error generating lessons:", error);
    return NextResponse.json(
      { error: "Failed to generate lessons" },
      { status: 500 }
    );
  }
}
