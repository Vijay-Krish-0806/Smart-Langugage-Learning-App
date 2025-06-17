// types/ai-lesson.ts
export interface AssessmentResult {
  userId: string;
  courseId: number;
  totalChallenges: number;
  correctAnswers: number;
  skillLevel: "beginner" | "intermediate" | "advanced";
  weakAreas: string[];
  strengths: string[];
  recommendedTopics: string[];
}

export interface GeneratedLesson {
  title: string;
  description: string;
  challenges: GeneratedChallenge[];
}

export interface GeneratedChallenge {
  type: "SELECT" | "ASSIST";
  question: string;
  options: {
    text: string;
    correct: boolean;
    imageSrc?: string;
    audioSrc?: string;
  }[];
}

export interface GeneratedUnit {
  title: string;
  description: string;
  lessons: GeneratedLesson[];
}
