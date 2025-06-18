"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";

interface StreakCalendarProps {
  recentActivity: Array<{
    date: string;
    lessonsCompleted: number;
    challengesCompleted: number;
    timeSpentMinutes: number;
    xpEarned: number;
  }>;
}

export const StreakCalendar = ({ recentActivity }: StreakCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  // Convert activity data to a map for easy lookup
  const activityMap = new Map(
    recentActivity.map((activity) => [activity.date, activity])
  );

  // Generate calendar grid for current month
  const generateCalendarDays = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  const currentMonth = today.getMonth();

  const selectedActivity = selectedDate
    ? activityMap.get(selectedDate.toISOString().split("T")[0])
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2" />
          Learning Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2 text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const dateStr = date.toISOString().split("T")[0];
            const activity = activityMap.get(dateStr);
            const isCurrentMonth = date.getMonth() === currentMonth;
            const isToday = date.toDateString() === today.toDateString();
            const isSelected =
              selectedDate &&
              date.toDateString() === selectedDate.toDateString();

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`
                  relative p-2 h-10 rounded-md text-sm transition-colors
                  ${
                    isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                  }
                  ${isToday ? "bg-blue-100 border-2 border-blue-500" : ""}
                  ${isSelected ? "bg-blue-50" : ""}
                  ${activity ? "bg-green-100" : ""}
                  hover:bg-gray-100
                `}
              >
                {date.getDate()}
                {activity && (
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        

        {selectedDate && !selectedActivity && (
          <div className="bg-gray-50 p-4 rounded-lg text-center text-muted-foreground">
            No learning activity recorded for{" "}
            {selectedDate.toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
