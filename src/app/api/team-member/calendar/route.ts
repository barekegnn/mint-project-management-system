import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverAuth";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (req: Request) => {
  const startTime = Date.now();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || String(new Date().getMonth());
    const year = searchParams.get('year') || String(new Date().getFullYear());

    const startDate = new Date(parseInt(year), parseInt(month), 1);
    const endDate = new Date(parseInt(year), parseInt(month) + 1, 0);

    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: user.id,
        deadline: { gte: startDate, lte: endDate }
      },
      include: {
        project: { select: { name: true } }
      }
    });

    // Group tasks by date
    const calendarData = tasks.reduce((acc, task) => {
      const date = new Date(task.deadline).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        project: task.project.name
      });
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json(calendarData);
  } catch (error) {
    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json({ error: "Failed to fetch calendar data" }, { status: 500 });
  }
}); 