"use client";

import { StreakDisplay } from "./StreakDisplay";
import { StreakCalendar } from "./StreakCalendar";
import { useStreak } from "@/hooks/useStreak";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export const StreakPage = () => {
  const { stats, loading, error, fetchStats } = useStreak();

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">
              Failed to load streak data: {error}
            </p>
            <Button onClick={fetchStats} variant="primary">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Learning Streak</h1>
        <Button onClick={fetchStats} variant="primary" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <StreakDisplay />

      <div className="grid gap-6">
        <StreakCalendar recentActivity={stats?.recentActivity || []} />
        
      </div>
    </div>
  );
};
