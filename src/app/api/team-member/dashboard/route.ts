import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverAuth";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Use Promise.all to run queries in parallel for better performance
    const [tasks, notifications, projects] = await Promise.all([
      // Get all tasks for the team member - only select needed fields
      prisma.task.findMany({
        where: {
          assignedToId: user.id
        },
        select: {
          id: true,
          status: true
        }
      }),
      
      // Get unread notifications count
      prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false
        }
      }),
      
      // Get projects count
      prisma.project.count({
        where: {
          teams: {
            some: {
              members: {
                some: {
                  id: user.id
                }
              }
            }
          }
        }
      })
    ]);

    // Calculate task statistics
    const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
    const pendingTasks = tasks.filter(task => task.status !== 'COMPLETED').length;
    const totalTasks = tasks.length;

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET team-member dashboard', duration);

  return NextResponse.json({
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks
      },
      notifications,
      projects
    });
  
}); 