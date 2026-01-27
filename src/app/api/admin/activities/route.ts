import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-error-handler";
import { Logger } from "@/lib/logger";

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  
  // Fetch recent activities from notifications
  const activities = await prisma.notification.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10, // Get last 10 activities
      include: {
        user: {
          select: {
            fullName: true
          }
        },
        project: {
          select: {
            name: true
          }
        }
      }
    });

    // Format the activities
    const formattedActivities = activities.map(activity => {
      let title = '';
      const status = 'completed';

      switch (activity.type) {
        case 'PROJECT_CREATED':
          title = `New project "${activity.project?.name}" created`;
          break;
        case 'PROJECT_UPDATED':
          title = `Project "${activity.project?.name}" updated`;
          break;
        case 'PROJECT_DELETED':
          title = `Project "${activity.project?.name}" deleted`;
          break;
        case 'TASK_ASSIGNED':
          title = `Task assigned to ${activity.user?.fullName}`;
          break;
        case 'TASK_CREATED':
          title = `New task created`;
          break;
        case 'TASK_UPDATED':
          title = `Task updated`;
          break;
        default:
          title = activity.message;
      }

      // Calculate time ago
      const now = new Date();
      const created = new Date(activity.createdAt);
      const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
      
      let timeAgo = '';
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
        timeAgo = `${diffInMinutes} minutes ago`;
      } else if (diffInHours < 24) {
        timeAgo = `${diffInHours} hours ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        timeAgo = `${diffInDays} days ago`;
      }

      return {
        id: activity.id,
        title,
        time: timeAgo,
        status,
        type: activity.type,
        createdAt: activity.createdAt
      };
    });

  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('Fetch activities', duration);

  return NextResponse.json({ activities: formattedActivities });
}); 