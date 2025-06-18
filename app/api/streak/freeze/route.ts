// app/api/streak/freeze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { StreakService } from "@/lib/streak";

const streakService = new StreakService();

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await streakService.useStreakFreeze(userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error using streak freeze:", error);
    return NextResponse.json(
      { error: "Failed to use streak freeze" },
      { status: 500 }
    );
  }
}
