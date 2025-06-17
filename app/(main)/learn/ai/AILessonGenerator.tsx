"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LearningProgress } from "./LearningProgress";

interface Props {
  courseId: number;
  courseName: string;
  assessmentResult: any;
}

export const AILessonGenerator = ({
  courseId,
  courseName,
  assessmentResult,
}: Props) => {
  const [numberOfUnits, setNumberOfUnits] = useState<string>("3");
  const [focusAreas, setFocusAreas] = useState<string>("");
  const [additionalTopics, setAdditionalTopics] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const generateLessons = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          assessmentResult: {
            ...assessmentResult,
            // Add any additional focus areas
            weakAreas: focusAreas
              ? [
                  ...assessmentResult.weakAreas,
                  ...focusAreas.split(",").map((t) => t.trim()),
                ]
              : assessmentResult.weakAreas,
            recommendedTopics: additionalTopics
              ? [
                  ...assessmentResult.recommendedTopics,
                  ...additionalTopics.split(",").map((t) => t.trim()),
                ]
              : assessmentResult.recommendedTopics,
          },
          numberOfUnits: parseInt(numberOfUnits),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Generated ${data.unitsCreated} personalized units!`);
        router.push("/learn");
      } else {
        toast.error(data.error || "Failed to generate lessons");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🎯 Generate Personalized Lessons for {courseName}</CardTitle>
        <CardDescription>
          Based on your assessment results, customize your learning path
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assessment Results Summary */}
        <LearningProgress progressData={assessmentResult} />

        {/* Customization Options */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="units">Number of Units to Generate</Label>
            <Select value={numberOfUnits} onValueChange={setNumberOfUnits}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Units</SelectItem>
                <SelectItem value="3">3 Units</SelectItem>
                <SelectItem value="4">4 Units</SelectItem>
                <SelectItem value="5">5 Units</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="focus">Additional Focus Areas (optional)</Label>
            <Textarea
              id="focus"
              placeholder="e.g., pronunciation, conversation skills, writing"
              value={focusAreas}
              onChange={(e) => setFocusAreas(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of specific areas you want to focus on
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topics">Additional Topics (optional)</Label>
            <Textarea
              id="topics"
              placeholder="e.g., travel, business, culture, cooking"
              value={additionalTopics}
              onChange={(e) => setAdditionalTopics(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of topics you're interested in learning
            </p>
          </div>
        </div>

        <Button
          onClick={generateLessons}
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating
            ? "Generating Personalized Lessons..."
            : "Generate My Learning Path"}
        </Button>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">
            What you'll get:
          </h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>
              • {numberOfUnits} complete learning units tailored to your level
            </li>
            <li>• 3-5 lessons per unit with varied exercises</li>
            <li>
              • Content focused on your weak areas identified in the assessment
            </li>
            <li>• Progressive difficulty that builds on your strengths</li>
            <li>• Interactive challenges designed for your learning style</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
