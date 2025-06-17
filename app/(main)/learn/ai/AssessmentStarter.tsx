"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AILessonGenerator } from "./AILessonGenerator";

interface Props {
  courseId: number;
  courseName: string;
}

interface AssessmentStatus {
  exists: boolean;
  completed: boolean;
  lessonId?: number;
  progress?: {
    completed: number;
    total: number;
  };
}

export const AssessmentStarter = ({ courseId, courseName }: Props) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [assessmentStatus, setAssessmentStatus] =
    useState<AssessmentStatus | null>(null);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAssessmentStatus();
  }, [courseId]);

  const checkAssessmentStatus = async () => {
    try {
      const response = await fetch(`/api/ai/assessment?courseId=${courseId}`);
      const data = await response.json();

      if (response.ok) {
        setAssessmentStatus(data);

        // If assessment is completed, automatically analyze it
        if (data.completed && data.lessonId) {
          await analyzeAssessment(data.lessonId);
        }
      }
    } catch (error) {
      console.error("Error checking assessment status:", error);
    } finally {
      setLoading(false);
    }
  };

  const createAssessment = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/ai/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.alreadyExists) {
          toast.info("Assessment already exists! Continue where you left off.");
        } else {
          toast.success(
            "Assessment lesson created! Start learning to get personalized lessons."
          );
        }
        router.push(`/lesson/${data.lessonId}`);
      } else {
        toast.error(data.error || "Failed to create assessment");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsCreating(false);
    }
  };

  const analyzeAssessment = async (lessonId?: number) => {
    const targetLessonId = lessonId || assessmentStatus?.lessonId;
    if (!targetLessonId) return;

    setIsAnalyzing(true);
    try {
      const analyzeResponse = await fetch("/api/ai/analyze-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: targetLessonId, courseId }),
      });

      const analyzeData = await analyzeResponse.json();

      if (analyzeData.success) {
        setAssessmentResult(analyzeData.assessmentResult);
        setShowGenerator(true);
        toast.success(
          "Assessment analyzed! Ready to generate personalized lessons."
        );
      } else {
        toast.error(analyzeData.error || "Failed to analyze assessment");
      }
    } catch (error) {
      toast.error("Something went wrong during analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show AI Lesson Generator if assessment is completed
  if (showGenerator && assessmentResult) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowGenerator(false)}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to assessment overview
        </button>
        <AILessonGenerator
          courseId={courseId}
          courseName={courseName}
          assessmentResult={assessmentResult}
        />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🤖 AI-Powered Learning for {courseName}</CardTitle>
        <CardDescription>
          Get personalized lessons based on your current knowledge level
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                assessmentStatus?.exists
                  ? "bg-green-500 text-white"
                  : "bg-blue-500 text-white"
              }`}
            >
              1
            </div>
            <div>
              <h3 className="font-semibold">Take Assessment</h3>
              <p className="text-sm text-muted-foreground">
                Complete a 10-question assessment to determine your skill level
              </p>
              {assessmentStatus?.exists && assessmentStatus.progress && (
                <div className="mt-2">
                  <Progress
                    value={
                      (assessmentStatus.progress.completed /
                        assessmentStatus.progress.total) *
                      100
                    }
                    className="w-32 h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {assessmentStatus.progress.completed}/
                    {assessmentStatus.progress.total} completed
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                assessmentStatus?.completed
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-white"
              }`}
            >
              2
            </div>
            <div>
              <h3 className="font-semibold">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Our AI analyzes your performance and identifies
                strengths/weaknesses
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                showGenerator
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-white"
              }`}
            >
              3
            </div>
            <div>
              <h3 className="font-semibold">Personalized Lessons</h3>
              <p className="text-sm text-muted-foreground">
                Get custom-generated units and lessons tailored to your needs
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {!assessmentStatus?.exists ? (
            <Button
              onClick={createAssessment}
              disabled={isCreating}
              className="w-full"
              size="lg"
            >
              {isCreating ? "Creating Assessment..." : "Start AI Assessment"}
            </Button>
          ) : !assessmentStatus.completed ? (
            <Button
              onClick={() =>
                router.push(`/lesson/${assessmentStatus.lessonId}`)
              }
              className="w-full"
              size="lg"
            >
              Continue Assessment
            </Button>
          ) : !showGenerator ? (
            <Button
              onClick={() => analyzeAssessment()}
              disabled={isAnalyzing}
              className="w-full"
              size="lg"
            >
              {isAnalyzing ? "Analyzing Assessment..." : "Generate My Lessons"}
            </Button>
          ) : (
            <Button
              onClick={() => setShowGenerator(true)}
              className="w-full"
              size="lg"
            >
              Customize Lesson Generation
            </Button>
          )}

          {isAnalyzing && (
            <div className="space-y-2">
              <Progress value={66} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                Analyzing your performance and preparing lesson generation...
              </p>
            </div>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">
            What makes this special?
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Adapts to your current knowledge level</li>
            <li>• Focuses on your weak areas first</li>
            <li>• Creates unlimited practice content</li>
            <li>• Follows proven language learning methodology</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
