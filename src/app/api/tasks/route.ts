import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createTaskSchema, updateTaskSchema } from "@/lib/validation-schemas";
import { withErrorHandler } from "@/lib/api-error-handler";
import { Logger } from "@/lib/logger";
import { AuthenticationError } from "@/lib/errors";
import { parsePaginationParams, createPaginationResult, getPrismaPaginationOptions } from "@/lib/pagination";

// Get all tasks with filtering options
export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const assignedTo = searchParams.get("assignedTo");

  // Parse pagination parameters
  const { page, limit } = parsePaginationParams(searchParams);

  Logger.debug("GET /api/tasks", { projectId, status, priority, assignedTo, page, limit });

  // Import getCurrentUser
  const { getCurrentUser } = await import("@/lib/serverAuth");
  
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new AuthenticationError("Unauthorized");
  }

  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assignedTo) where.assignedToId = assignedTo;

  // Only show tasks from projects this manager is responsible for
  if (projectId) {
    where.project = {
      holderId: currentUser.id
    };
  } else {
    where.project = {
      holderId: currentUser.id
    };
  }

  Logger.debug("Prisma where clause", { where, userId: currentUser.id, role: currentUser.role });

  // Get total count for pagination
  const total = await prisma.task.count({ where });

  // Fetch tasks with optimized field selection
  const tasks = await prisma.task.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      deadline: true,
      projectId: true,
      assignedToId: true,
      createdAt: true,
      updatedAt: true,
      project: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
      comments: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5, // Only fetch latest 5 comments
      },
      labels: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      attachments: {
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    ...getPrismaPaginationOptions(page, limit),
  });

  // Log slow query if it takes more than 500ms
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('SELECT tasks with includes', duration);
  
  Logger.debug("Found tasks", { count: tasks.length, total });
  
  // Return paginated response
  const result = createPaginationResult(tasks, total, page, limit);
  return NextResponse.json(result);
});

// Create a new task
export const POST = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  const body = await request.json();
  Logger.debug("POST /api/tasks", { body });

  // Validate input with Zod
  const validatedData = createTaskSchema.parse(body);

  const {
    title,
    description,
    projectId,
    assignedToId,
    status,
    priority,
    deadline,
  } = validatedData;

  // Verify project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, dueDate: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Enforce: task deadline must not exceed project's due date
  if (deadline && project.dueDate) {
    const taskDeadline = new Date(deadline);
    const projectDue = new Date(project.dueDate);
    if (taskDeadline.getTime() > projectDue.getTime()) {
      return NextResponse.json(
        {
          error: "Task deadline cannot exceed the project's due date",
          recommendation: "Set the task deadline on or before the project's due date, or extend the project's due date first.",
          projectDueDate: projectDue.toISOString(),
          allowedLatestDate: projectDue.toISOString(),
        },
        { status: 400 }
      );
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      projectId,
      assignedToId: assignedToId || null,
      status: status || "TODO",
      priority: priority || "MEDIUM",
      deadline: deadline ? new Date(deadline) : null,
    },
    include: {
      project: true,
      assignedTo: true,
      labels: true,
    },
  });

  // Log slow query if it takes more than 500ms
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('INSERT task with includes', duration);

  Logger.info("Task created", { taskId: task.id, title: task.title });
  return NextResponse.json(task);
});

// Update a task
export const PUT = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  const body = await request.json();
  const { id, ...updateFields } = body;

  if (!id) {
    return NextResponse.json(
      { error: "Task ID is required" },
      { status: 400 }
    );
  }

  // Validate update fields with Zod
  const validatedData = updateTaskSchema.parse(updateFields);

  // Special handling for deadline if present
  if (validatedData.deadline) {
    // Validate against parent project's dueDate
    const existingTaskForDeadline = await prisma.task.findUnique({
      where: { id },
      select: { projectId: true },
    });
    if (!existingTaskForDeadline) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    const parentProject = await prisma.project.findUnique({
      where: { id: existingTaskForDeadline.projectId },
      select: { dueDate: true },
    });
    if (parentProject?.dueDate) {
      const newDeadline = new Date(validatedData.deadline);
      const projectDue = new Date(parentProject.dueDate);
      if (newDeadline.getTime() > projectDue.getTime()) {
        return NextResponse.json(
          {
            error: "Task deadline cannot exceed the project's due date",
            recommendation: "Set the task deadline on or before the project's due date, or extend the project's due date first.",
            projectDueDate: projectDue.toISOString(),
            allowedLatestDate: projectDue.toISOString(),
          },
          { status: 400 }
        );
      }
    }
  }

  const task = await prisma.task.update({
    where: { id },
    data: validatedData,
    include: {
      project: true,
      assignedTo: true,
      labels: true,
    },
  });

  // Log slow query if it takes more than 500ms
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('UPDATE task with includes', duration);

  Logger.info("Task updated", { taskId: task.id, title: task.title });
  return NextResponse.json(task);
});

// Delete a task
export const DELETE = withErrorHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Task ID is required" },
      { status: 400 }
    );
  }

  // Get task before deletion to use in notification
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignedTo: true,
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await prisma.task.delete({
    where: { id },
  });

  // Create notification for assigned user if exists
  if (task.assignedToId) {
    await prisma.notification.create({
      data: {
        type: "TASK_DELETED",
        message: `Task "${task.title}" has been deleted`,
        userId: task.assignedToId,
        projectId: task.projectId,
      },
    });
  }

  Logger.info("Task deleted", { taskId: task.id, title: task.title });
  return NextResponse.json({ success: true });
});
