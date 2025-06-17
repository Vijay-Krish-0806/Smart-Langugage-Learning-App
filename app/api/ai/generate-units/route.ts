// app/api/ai/generate-units/route.ts
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

import * as schema from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId, assessmentResult, numberOfUnits = 3 } = await req.json();

    // Get course details
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const generator = new GeminiLessonGenerator();
    const generatedUnits = await generator.generatePersonalizedUnits(
      course.title,
      assessmentResult,
      numberOfUnits
    );

    // Get the highest order number for existing units
    const existingUnits = await db.query.units.findMany({
      where: eq(units.courseId, courseId),
      orderBy: (units, { desc }) => [desc(units.order)],
    });

    let nextUnitOrder =
      existingUnits.length > 0 ? existingUnits[0].order + 1 : 1;

    // Create units, lessons, and challenges
    await db.delete(schema.units);
    await db.delete(schema.lessons);
    await db.delete(schema.challenges);
    await db.delete(schema.challengeOptions);
    await db.delete(schema.challengeProgress);

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
      message: "Personalized units created successfully",
    });
  } catch (error) {
    console.error("Error generating units:", error);
    return NextResponse.json(
      { error: "Failed to generate personalized units" },
      { status: 500 }
    );
  }
}
