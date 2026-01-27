import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverAuth";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';
import { AuthenticationError } from '@/lib/errors';

async function calculateStreak(userId: string): Promise<number> {
  let streak = 0;
  const day = new Date();
  
  for (let i = 0; i < 7; i++) {
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const count = await prisma.task.count({
      where: {
        assignedToId: userId,
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
  
  return streak;
}

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  const user = await getCurrentUser();
  
  if (!user) {
    throw new AuthenticationError("Unauthorized");
  }

  // Calculate achievements based on user performance
  const achievements = [];

  // Get user stats
  const totalTasks = await prisma.task.count({
    where: { assignedToId: user.id, status: 'COMPLETED' }
  });

  const thisWeekTasks = await prisma.task.count({
    where: {
      assignedToId: user.id,
      status: 'COMPLETED',
      updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }
  });

  const streak = await calculateStreak(user.id);

  // Define achievements
  if (totalTasks >= 10) achievements.push({
    id: 'first_10',
    title: 'Task Master',
    description: 'Completed 10 tasks',
    icon: '🎯',
    unlocked: true,
    progress: 100
  });

  if (thisWeekTasks >= 5) achievements.push({
    id: 'weekly_5',
    title: 'Weekly Warrior',
    description: 'Completed 5 tasks this week',
    icon: '⚡',
    unlocked: true,
    progress: 100
  });

  if (streak >= 3) achievements.push({
    id: 'streak_3',
    title: 'Consistency King',
    description: '3-day completion streak',
    icon: '🔥',
    unlocked: true,
    progress: 100
  });

  // Add more achievements as needed
  achievements.push({
    id: 'next_milestone',
    title: 'Next Milestone',
    description: 'Complete 20 tasks',
    icon: '🏆',
    unlocked: totalTasks >= 20,
    progress: Math.min((totalTasks / 20) * 100, 100)
  });

  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET achievements', duration);

  return NextResponse.json(achievements);
}); 