import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { uploadToBlob, isValidFileSize, ALLOWED_DOCUMENT_TYPES, MAX_FILE_SIZE } from "@/lib/blob-storage";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const config = {
  api: {
    bodyParser: false,
  },
};

export const POST = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse multipart form data using FormData API
    const formData = await request.formData();
    
    const taskId = formData.get("taskId") as string;
    const projectId = formData.get("projectId") as string;
    const description = formData.get("description") as string;
    const recipientId = formData.get("recipientId") as string;
    const file = formData.get("file") as File;

    // Fetch recipient
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    });
    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    // Role-based validation
    if (user.role === "TEAM_MEMBER") {
      // Team member must provide taskId and send to manager
      if (!taskId || !recipientId || !file) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }
      if (recipient.role !== "PROJECT_MANAGER") {
        return NextResponse.json(
          { error: "Team members can only send reports to managers" },
          { status: 403 }
        );
      }
      // Fetch the task to get the title
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      // Validate file size
      if (!isValidFileSize(file.size, MAX_FILE_SIZE)) {
        return NextResponse.json({ 
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
        }, { status: 400 });
      }

      // Convert file to buffer and upload to Blob
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileUrl = await uploadToBlob(buffer, file.name, 'reports');

      // Create report
      const report = await prisma.report.create({
        data: {
          title: task.title,
          taskId,
          description,
          fileUrl,
          fileName: file.name,
          fileType: file.type,
          senderId: user.id,
          recipientId,
        },
        include: {
          sender: { select: { id: true, fullName: true, email: true } },
          recipient: { select: { id: true, fullName: true, email: true } },
        },
      });
      return NextResponse.json(report);
    } else if (user.role === "PROJECT_MANAGER") {
      // Manager must provide projectId and send to admin
      if (!projectId || !recipientId || !file) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }
      if (recipient.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Managers can only send reports to admins" },
          { status: 403 }
        );
      }
      // Fetch the project to get the title
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      // Validate file size
      if (!isValidFileSize(file.size, MAX_FILE_SIZE)) {
        return NextResponse.json({ 
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
        }, { status: 400 });
      }

      // Convert file to buffer and upload to Blob
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileUrl = await uploadToBlob(buffer, file.name, 'reports');

      // Create report
      const report = await prisma.report.create({
        data: {
          title: project.name,
          description,
          fileUrl,
          fileName: file.name,
          fileType: file.type,
          senderId: user.id,
          recipientId,
        },
        include: {
          sender: { select: { id: true, fullName: true, email: true } },
          recipient: { select: { id: true, fullName: true, email: true } },
        },
      });
      return NextResponse.json(report);
    } else {
      
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('POST mint_pms', duration);

  return NextResponse.json(
        { error: "Not allowed" },
        { status: 403 }
      );
    }
  
});

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "received"; // "sent" or "received"
    const status = searchParams.get("status"); // "PENDING", "APPROVED", "REJECTED"

    // Import pagination utilities
    const { parsePaginationParams, createPaginationResult, getPrismaPaginationOptions } = await import("@/lib/pagination");
    const { page, limit } = parsePaginationParams(searchParams);

    const where: any = {
      ...(type === "sent" ? { senderId: user.id } : { recipientId: user.id }),
    };
    if (status) {
      where.status = status.toUpperCase();
    }

    // Get total count for pagination
    const total = await prisma.report.count({ where });

    // Fetch reports with optimized field selection
    const reports = await prisma.report.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        fileUrl: true,
        fileName: true,
        fileType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        taskId: true,
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        recipient: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      ...getPrismaPaginationOptions(page, limit),
    });

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET reports', duration);

  // Return paginated response
  const result = createPaginationResult(reports, total, page, limit);
  return NextResponse.json(result);
  
});
