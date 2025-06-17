// lib/gemini.ts
import {
  AssessmentResult,
  GeneratedLesson,
  GeneratedUnit,
} from "@/types/ai-lessons";
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export class GeminiLessonGenerator {
  async generateAssessmentLesson(language: string): Promise<GeneratedLesson> {
    const prompt = `
Create an assessment lesson for ${language} language learning with exactly 5 challenges.
The lesson should test basic vocabulary, grammar, and comprehension to determine user's skill level.

Include a mix of:
- Basic vocabulary (colors, numbers, family members, common objects)
- Simple grammar structures
- Common phrases and greetings
- Basic verb conjugations

Return a JSON object with this structure:
{
  "title": "Assessment: ${language} Basics",
  "description": "Let's see what you already know about ${language}",
  "challenges": [
    {
      "type": "SELECT" | "ASSIST",
      "question": "Question text",
      "options": [
        {
          "text": "Option text",
          "correct": true/false,
          "imageSrc": "/path/to/image.svg",
          "audioSrc": "/path/to/audio.mp3"
        }
      ]
    }
  ]
}

Make sure to have exactly 5 challenges with varied difficulty levels.
For SELECT type challenges, provide 3-4 options.
For ASSIST type challenges, provide 3 options.
Use realistic image and audio paths based on the content, If possible give urls.
`;

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const text = await response.text;
      const jsonMatch = text?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Invalid response format");
    } catch (error) {
      console.error("Error generating assessment lesson:", error);
      throw new Error("Failed to generate assessment lesson");
    }
  }

  async analyzeAssessmentResults(
    userId: string,
    courseId: number,
    results: { challengeId: number; correct: boolean|null; topic: string }[]
  ): Promise<AssessmentResult> {
    const totalChallenges = results.length;
    const correctAnswers = results.filter((r) => r.correct).length;
    const accuracy = correctAnswers / totalChallenges;

    let skillLevel: "beginner" | "intermediate" | "advanced";
    if (accuracy < 0.3) skillLevel = "beginner";
    else if (accuracy < 0.7) skillLevel = "intermediate";
    else skillLevel = "advanced";

    const topicPerformance = results.reduce((acc, result) => {
      if (!acc[result.topic]) {
        acc[result.topic] = { correct: 0, total: 0 };
      }
      acc[result.topic].total++;
      if (result.correct) acc[result.topic].correct++;
      return acc;
    }, {} as Record<string, { correct: number; total: number }>);

    const weakAreas = Object.entries(topicPerformance)
      .filter(([_, perf]) => perf.correct / perf.total < 0.5)
      .map(([topic]) => topic);

    const strengths = Object.entries(topicPerformance)
      .filter(([_, perf]) => perf.correct / perf.total >= 0.7)
      .map(([topic]) => topic);

    const recommendedTopics = this.getRecommendedTopics(skillLevel, weakAreas);

    return {
      userId,
      courseId,
      totalChallenges,
      correctAnswers,
      skillLevel,
      weakAreas,
      strengths,
      recommendedTopics,
    };
  }

  async generatePersonalizedUnits(
    language: string,
    assessmentResult: AssessmentResult,
    numberOfUnits: number = 3
  ): Promise<GeneratedUnit[]> {
    const prompt = `
Based on the user's assessment results, generate ${numberOfUnits} learning units for ${language}.

User Assessment:
- Skill Level: ${assessmentResult.skillLevel}
- Weak Areas: ${assessmentResult.weakAreas.join(", ") || "None"}
- Strengths: ${assessmentResult.strengths.join(", ") || "None"}
- Recommended Topics: ${assessmentResult.recommendedTopics.join(", ") || "None"}

Create units that:
1. Address the user's weak areas first
2. Build upon their strengths
3. Follow a logical progression
4. Include varied challenge types

Each unit should have 3-5 lessons, and each lesson should have 5-8 challenges. Don't forget to give options array.
For SELECT type challenges, provide 3-4 options.
For ASSIST type challenges, provide 3 options.

Return a JSON array with this structure:
[
  {
    "title": "Unit title",
    "description": "Unit description",
    "lessons": [
      {
        "title": "Lesson title",
        "description": "Lesson description",
        "challenges": [
          {
            "type": "SELECT" | "ASSIST",
            "question": "Question text",
            "options": [
              {
                "text": "Option text",
                "correct": true/false,
                "imageSrc": "/path/to/image.svg",
                "audioSrc": "/path/to/audio.mp3"
              }
            ]
          }
        ]
      }
    ]
  }
]
`;

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const text = await response.text;
      const jsonMatch = text?.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Invalid response format");
    } catch (error) {
      console.error("Error generating personalized units:", error);
      throw new Error("Failed to generate personalized units");
    }
  }

  private getRecommendedTopics(
    skillLevel: string,
    weakAreas: string[]
  ): string[] {
    const topicsByLevel = {
      beginner: [
        "Basic Greetings",
        "Numbers 1-20",
        "Colors",
        "Family Members",
        "Common Objects",
        "Days of the Week",
        "Present Tense Verbs",
      ],
      intermediate: [
        "Past Tense",
        "Future Tense",
        "Adjectives",
        "Prepositions",
        "Food and Drinks",
        "Clothing",
        "Weather",
        "Directions",
      ],
      advanced: [
        "Subjunctive Mood",
        "Conditional Tense",
        "Complex Grammar",
        "Idiomatic Expressions",
        "Professional Vocabulary",
        "Literature",
      ],
    };

    const levelTopics =
      topicsByLevel[skillLevel as keyof typeof topicsByLevel] ||
      topicsByLevel.beginner;

    const prioritized = [
      ...weakAreas,
      ...levelTopics.filter((topic) => !weakAreas.includes(topic)),
    ];

    return prioritized.slice(0, 8);
  }
}
