import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createTaskSchema, updateTaskSchema } from "@/lib/validation-schemas";
import { ZodError } from "zod";

// Get all tasks with filtering options
export async function GET(request: Request) {
  try {
    console.log("GET /api/tasks - Starting request");
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedTo = searchParams.get("assignedTo");

    console.log("Query params:", { projectId, status, priority, assignedTo });

    // Import getCurrentUser
    const { getCurrentUser } = await import("@/lib/serverAuth");
    
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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

    console.log("Prisma where clause:", where);
    console.log("Current user:", currentUser.id, currentUser.role);

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: true,
        assignedTo: true,
        comments: {
          include: {
            author: true,
          },
        },
        labels: true,
        attachments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("Found tasks:", tasks.length);
    console.log("Tasks belong to projects managed by current user:", tasks.every(t => t.project.holderId === currentUser.id));
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// Create a new task
export async function POST(request: Request) {
  try {
    console.log("POST /api/tasks - Starting request");
    const body = await request.json();
    console.log("Request body:", body);

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

    console.log("Created task:", task);
    return NextResponse.json(task);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

// Update a task
export async function PUT(request: Request) {
  try {
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

    return NextResponse.json(task);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// Delete a task
export async function DELETE(request: Request) {
  try {
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
