import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverAuth";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Calculate streak
  let streak = 0;
  const day = new Date();
  for (let i = 0; i < 7; i++) {
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const count = await prisma.task.count({
      where: {
        assignedToId: user.id,
        status: "COMPLETED",
        updatedAt: { gte: start, lt: end }
      }
    });
    if (count > 0) {
      streak++;
      day.setDate(day.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate badges
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);
  const tasksThisWeek = await prisma.task.count({
    where: {
      assignedToId: user.id,
      status: "COMPLETED",
      updatedAt: { gte: weekAgo }
    }
  });

  const badges = [];
  if (tasksThisWeek >= 5) badges.push({ label: "5 Tasks in a Week", type: "star" });
  if (streak >= 3) badges.push({ label: `${streak}-Day Streak`, type: "flame" });

  
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json({ badges, streak });
}); 