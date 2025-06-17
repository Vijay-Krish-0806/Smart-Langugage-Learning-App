"use client";

import { courses, userProgress } from "@/db/schema";
import { Card } from "./card";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { upsertUserProgress } from "@/actions/user-progress";
import { toast } from "sonner";
import { AssessmentStarter } from "../learn/ai/AssessmentStarter";

type Props = {
  courses: (typeof courses.$inferSelect)[];
  activeCourseId?: typeof userProgress.$inferSelect.activeCourseId;
  showAIAssessment?: boolean;
};

export const List = ({
  courses,
  activeCourseId,
  showAIAssessment = false,
}: Props) => {
  const router = useRouter();
  const [pending, startTransistion] = useTransition();
  const [selectedCourseForAI, setSelectedCourseForAI] = useState<number | null>(
    null
  );

  const onClick = (id: number, title: string) => {
    if (pending) return;

    if (id === activeCourseId) {
      return router.push("/learn");
    }

    startTransistion(() => {
      upsertUserProgress(id).catch(() => toast.error("Something went wrong"));
    });
  };

  const handleAILearning = (courseId: number, courseName: string) => {
    console.log(courseId)
    setSelectedCourseForAI(courseId);
  };

  if (selectedCourseForAI) {
    const course = courses.find((c) => c.id === selectedCourseForAI);
    return (
      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={() => setSelectedCourseForAI(null)}
          className="self-start text-blue-600 hover:text-blue-800"
        >
          ← Back to courses
        </button>
        <AssessmentStarter
          courseId={selectedCourseForAI}
          courseName={course?.title || ""}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      

      <div className="pt-6 grid grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
        {courses.map((course) => (
          <Card
            key={course.id}
            id={course.id}
            title={course.title}
            imageSrc={course.imgSrc}
            onClick={onClick}
            onAIClick={
              showAIAssessment
                ? () => handleAILearning(course.id, course.title)
                : undefined
            }
            disabled={pending}
            active={course.id === activeCourseId}
          />
        ))}
      </div>
    </div>
  );
};
