// lib/ai-service.ts
import ollama from "ollama";

export interface AssessmentResult {
  skillLevel: any;
  weakAreas: any;
  recommendedTopics: any;
  level: "beginner" | "intermediate" | "advanced";
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface GeneratedUnit {
  title: string;
  description: string;
  order: number;
  lessons: GeneratedLesson[];
}

export interface GeneratedLesson {
  title: string;
  order: number;
  challenges: GeneratedChallenge[];
}

export interface GeneratedChallenge {
  type: "SELECT" | "ASSIST";
  question: string;
  order: number;
  options: GeneratedChallengeOption[];
}

export interface GeneratedChallengeOption {
  text: string;
  correct: boolean;
  imageSrc?: string;
  audioSrc?: string;
}

// UPDATED extractJSONFromMarkdown function
function extractJSONFromMarkdown(raw: string): string {
  // First try to extract from markdown code block
  const markdownMatch = raw.match(/```(?:json)?\n([\s\S]+?)```/i);
  if (markdownMatch) return markdownMatch[1];

  // If no markdown found, find the first valid JSON object
  const jsonStart = raw.search(/\{[^{}]*\}/);
  if (jsonStart !== -1) {
    const jsonEnd = raw.indexOf("}", jsonStart) + 1;
    return raw.substring(jsonStart, jsonEnd);
  }

  // Fallback: return entire trimmed content
  return raw.trim();
}

class AILessonService {
  private model = "llama3.1:8b";

  async generateAssessmentLesson(language: string): Promise<GeneratedLesson> {
    const prompt = `Generate an assessment lesson for ${language} language learning with exactly 15 challenges to determine user's proficiency level.

Create a mix of basic to intermediate challenges covering:
- Basic vocabulary (nouns, verbs, adjectives)
- Grammar fundamentals
- Sentence structure
- Common phrases

Return ONLY valid JSON without any additional text or explanations. Use this exact format:

  {
    "title": "Assessment - ${language} Basics",
    "order": 1,
    "challenges": [
      {
        "type": "SELECT",
        "question": "Which one means 'hello' in ${language}?",
        "order": 1,
        "options": [
          {"text": "hola", "correct": true},
          {"text": "adios", "correct": false},
          {"text": "gracias", "correct": false}
        ]
      }
    ]
  }


Generate exactly 15 challenges with varying difficulty. Should have only options type. Don't include fill in the blanks.`;

    try {
      const response = await ollama.chat({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      });

      const raw = response.message.content;

      const json = extractJSONFromMarkdown(raw);
      return JSON.parse(json);
    } catch (error) {
      console.error("Error generating assessment lesson:", error);
      throw new Error("Failed to generate assessment lesson");
    }
  }

  async assessUserPerformance(
    challengeResults: {
      challengeId: number;
      correct: boolean;
      timeSpent: number;
    }[],
    language: string
  ): Promise<AssessmentResult> {
    const total = challengeResults.length;
    const correct = challengeResults.filter((r) => r.correct).length;
    const score = (correct / total) * 100;
    const avgTime =
      challengeResults.reduce((sum, r) => sum + r.timeSpent, 0) / total;

    const prompt = `Analyze this assessment:
Language: ${language}
Score: ${score}% (${correct}/${total} correct)
Average time per question: ${avgTime} seconds

Return ONLY JSON:
{
  "level": "beginner|intermediate|advanced",
  "score": ${score},
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."]
}`;

    try {
      const response = await ollama.chat({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      });

      const raw = response.message.content;
      const json = extractJSONFromMarkdown(raw);
      return JSON.parse(json);
    } catch (error) {
      console.error("Error assessing user performance:", error);
      throw new Error("Failed to assess user performance");
    }
  }

  async generatePersonalizedUnits(
    language: string,
    level: string,
    strengths: string[],
    weaknesses: string[],
    unitsCount = 5
  ): Promise<GeneratedUnit[]> {
    const prompt = `Generate ${unitsCount} units for ${language} learner (level: ${level}).
Strengths: ${strengths.join(", ")}
Weaknesses: ${weaknesses.join(", ")}

Each unit must include:
- title
- description
- order
- 3-5 lessons
Each lesson must include:
- title
- order
- 8-12 challenges
Return ONLY valid JSON.`;

    try {
      const response = await ollama.chat({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      });

      const raw = response.message.content;
      const json = extractJSONFromMarkdown(raw);
      return JSON.parse(json);
    } catch (error) {
      console.error("Error generating personalized units:", error);
      throw new Error("Failed to generate personalized units");
    }
  }

  async generateAdaptiveLessons(
    language: string,
    currentUnitTitle: string,
    performance: { lessonId: number; score: number; difficulty: string }[],
    count = 3
  ): Promise<GeneratedLesson[]> {
    const avgScore =
      performance.reduce((sum, p) => sum + p.score, 0) / performance.length;

    const prompt = `Generate ${count} adaptive lessons for ${language}.
Context:
- Unit: ${currentUnitTitle}
- Avg score: ${avgScore}%
- Performance: ${JSON.stringify(performance)}
Adapt:
- >85%: harder
- 70-85%: similar
- <70%: easier
Return only JSON.`;

    try {
      const response = await ollama.chat({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      });

      const raw = response.message.content;
      const json = extractJSONFromMarkdown(raw);
      return JSON.parse(json);
    } catch (error) {
      console.error("Error generating adaptive lessons:", error);
      throw new Error("Failed to generate adaptive lessons");
    }
  }
}

export const aiLessonService = new AILessonService();
