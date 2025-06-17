// lib/lesson-generator.ts
import { aiLessonService, AssessmentResult, GeneratedUnit } from "./ai-service";
import db from "@/db/drizzle";
import {
  units,
  lessons,
  challenges,
  challengeOptions,
  userProgress,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";

export class LessonGenerator {
  async createAssessmentLesson(courseId: number, language: string) {
    try {
      console.log(`Generating assessment lesson for ${language}...`);

      // Generate AI assessment lesson
      const generatedLesson = await aiLessonService.generateAssessmentLesson(
        language
      );

      // Create assessment unit
      const [unit] = await db
        .insert(units)
        .values({
          title: "Assessment",
          description: `Initial assessment for ${language}`,
          courseId,
          order: 0, // Assessment comes first
        })
        .returning();

      // Create assessment lesson
      const [lesson] = await db
        .insert(lessons)
        .values({
          title: generatedLesson.title,
          unitId: unit.id,
          order: generatedLesson.order,
        })
        .returning();

      // Create challenges and options
      for (const challenge of generatedLesson.challenges) {
        const [createdChallenge] = await db
          .insert(challenges)
          .values({
            lessonId: lesson.id,
            type: challenge.type,
            question: challenge.question,
            order: challenge.order,
          })
          .returning();

        // Create challenge options
        const optionsData = challenge.options.map((option) => ({
          challengeId: createdChallenge.id,
          text: option.text,
          correct: option.correct,
          imageSrc: option.imageSrc || null,
          audioSrc: option.audioSrc || null,
        }));

        await db.insert(challengeOptions).values(optionsData);
      }

      console.log(
        `✅ Assessment lesson created with ${generatedLesson.challenges.length} challenges`
      );
      return { unitId: unit.id, lessonId: lesson.id };
    } catch (error) {
      console.error("Error creating assessment lesson:", error);
      throw new Error("Failed to create assessment lesson");
    }
  }

  async generatePersonalizedCurriculum(
    userId: string,
    courseId: number,
    language: string,
    assessmentResults: {
      challengeId: number;
      correct: boolean;
      timeSpent: number;
    }[]
  ) {
    try {
      console.log(`Generating personalized curriculum for user ${userId}...`);

      // Assess user performance
      const assessment = await aiLessonService.assessUserPerformance(
        assessmentResults,
        language
      );

      // Update user progress with assessment results
      await db
        .update(userProgress)
        .set({
          // You might want to add assessment fields to your schema
          // assessmentLevel: assessment.level,
          // assessmentScore: assessment.score,
        })
        .where(eq(userProgress.userId, userId));

      // Generate personalized units
      const generatedUnits = await aiLessonService.generatePersonalizedUnits(
        language,
        assessment.level,
        assessment.strengths,
        assessment.weaknesses,
        5 // Generate 5 units
      );

      // Save units to database
      const createdUnits = [];
      await db.delete(schema.units);
      await db.delete(schema.lessons);
      await db.delete(schema.challenges);
      await db.delete(schema.challengeOptions);
      await db.delete(schema.challengeProgress);

      for (const unitData of generatedUnits) {
        const [unit] = await db
          .insert(units)
          .values({
            title: unitData.title,
            description: unitData.description,
            courseId,
            order: unitData.order,
          })
          .returning();

        // Create lessons for this unit
        for (const lessonData of unitData.lessons) {
          const [lesson] = await db
            .insert(lessons)
            .values({
              title: lessonData.title,
              unitId: unit.id,
              order: lessonData.order,
            })
            .returning();

          // Create challenges for this lesson
          for (const challengeData of lessonData.challenges) {
            const [challenge] = await db
              .insert(challenges)
              .values({
                lessonId: lesson.id,
                type: challengeData.type,
                question: challengeData.question,
                order: challengeData.order,
              })
              .returning();

            // Create challenge options
            const optionsData = challengeData.options.map((option) => ({
              challengeId: challenge.id,
              text: option.text,
              correct: option.correct,
              imageSrc: option.imageSrc || null,
              audioSrc: option.audioSrc || null,
            }));

            await db.insert(challengeOptions).values(optionsData);
          }
        }

        createdUnits.push(unit);
      }

      console.log(`✅ Generated ${createdUnits.length} personalized units`);
      return { assessment, units: createdUnits };
    } catch (error) {
      console.error("Error generating personalized curriculum:", error);
      throw new Error("Failed to generate personalized curriculum");
    }
  }

  async generateAdaptiveLessons(
    userId: string,
    unitId: number,
    language: string,
    performanceHistory: {
      lessonId: number;
      score: number;
      difficulty: string;
    }[]
  ) {
    try {
      console.log(`Generating adaptive lessons for unit ${unitId}...`);

      // Get unit info
      const unit = await db.query.units.findFirst({
        where: eq(units.id, unitId),
      });

      if (!unit) throw new Error("Unit not found");

      // Generate adaptive lessons
      const generatedLessons = await aiLessonService.generateAdaptiveLessons(
        language,
        unit.title,
        performanceHistory,
        3 // Generate 3 new lessons
      );

      // Get the highest order number for existing lessons in this unit
      const existingLessons = await db.query.lessons.findMany({
        where: eq(lessons.unitId, unitId),
        orderBy: (lessons, { desc }) => [desc(lessons.order)],
      });

      const nextOrder =
        existingLessons.length > 0 ? existingLessons[0].order + 1 : 1;

      // Save new lessons to database
      const createdLessons = [];
      for (let i = 0; i < generatedLessons.length; i++) {
        const lessonData = generatedLessons[i];

        const [lesson] = await db
          .insert(lessons)
          .values({
            title: lessonData.title,
            unitId: unitId,
            order: nextOrder + i,
          })
          .returning();

        // Create challenges for this lesson
        for (const challengeData of lessonData.challenges) {
          const [challenge] = await db
            .insert(challenges)
            .values({
              lessonId: lesson.id,
              type: challengeData.type,
              question: challengeData.question,
              order: challengeData.order,
            })
            .returning();

          // Create challenge options
          const optionsData = challengeData.options.map((option) => ({
            challengeId: challenge.id,
            text: option.text,
            correct: option.correct,
            imageSrc: option.imageSrc || null,
            audioSrc: option.audioSrc || null,
          }));

          await db.insert(challengeOptions).values(optionsData);
        }

        createdLessons.push(lesson);
      }

      console.log(`✅ Generated ${createdLessons.length} adaptive lessons`);
      return createdLessons;
    } catch (error) {
      console.error("Error generating adaptive lessons:", error);
      throw new Error("Failed to generate adaptive lessons");
    }
  }
}

export const lessonGenerator = new LessonGenerator();
