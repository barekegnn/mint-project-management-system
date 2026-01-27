import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverAuth";
import { NotificationType } from "@prisma/client";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ memberId: string }> }) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { memberId } = await params;

    // Fetch all tasks assigned to this team member
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: memberId,
        project: {
          holderId: user.id // Only tasks from projects managed by this user
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json({ tasks });
  
});

export const POST = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ memberId: string }> }) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    Logger.info(`[TASK_ASSIGNMENT] User ${user.id} attempting to assign task`);
    Logger.info(`[TASK_ASSIGNMENT] Current user role: ${user.role}`);

    const body = await request.json();
    const { taskId, dueDate } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    Logger.info(`[TASK_ASSIGNMENT] Looking for task ${taskId}`);

    // Verify the task exists and belongs to a project managed by this user
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          holderId: user.id
        }
      },
      include: {
        project: true
      }
    });

    if (!task) {
      Logger.info(`[TASK_ASSIGNMENT] Task not found with project.holderId = ${user.id}`);
      // Additional check if task exists in other projects
      const taskExists = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true }
      });
      
      if (taskExists) {
        Logger.info(`[TASK_ASSIGNMENT] Task exists but belongs to another project manager`);
        return NextResponse.json(
          { error: "Task not found or access unauthorized. Please ensure you are the project manager for this task." },
          { status: 403 }
        );
      } else {
        return NextResponse.json(
          { error: "Task not found" },
          { status: 404 }
        );
      }
    }

    Logger.info(`[TASK_ASSIGNMENT] Found task: ${task.title} in project: ${task.project.name}`);

    // Get the memberId from params
    const { memberId } = await params;

    // Update the task with the assigned team member
    const updatedTask = await prisma.task.update({
      where: {
        id: taskId
      },
      data: {
        assignedToId: memberId,
        deadline: dueDate ? new Date(dueDate) : null
      },
      include: {
        assignedTo: true,
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create notification for the assigned member
    await prisma.notification.create({
      data: {
        type: NotificationType.TASK_CREATED,
        message: `You have been assigned to task "${updatedTask.title}"`,
        userId: memberId,
        projectId: task.projectId,
      },
    });

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('POST mint_pms', duration);

  return NextResponse.json({ task: updatedTask });
  
}); 