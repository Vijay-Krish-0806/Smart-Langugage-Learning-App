// app/api/streak/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { StreakService } from "@/lib/streak";

const streakService = new StreakService();

// GET - Get streak statistics
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await streakService.getStreakStats(userId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching streak stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch streak statistics" },
      { status: 500 }
    );
  }
}

// POST - Update streak (called when user completes learning activity)
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      lessonsCompleted = 0,
      challengesCompleted = 0,
      timeSpentMinutes = 0,
      xpEarned = 0,
    } = await req.json();

    const result = await streakService.updateStreak(
      userId,
      lessonsCompleted,
      challengesCompleted,
      timeSpentMinutes,
      xpEarned
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating streak:", error);
    return NextResponse.json(
      { error: "Failed to update streak" },
      { status: 500 }
    );
  }
}
