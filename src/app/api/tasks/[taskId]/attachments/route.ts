import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { uploadToBlob, deleteFromBlob, isValidFileSize, ALLOWED_DOCUMENT_TYPES, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/blob-storage";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ taskId: string }> }) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;

    const attachments = await prisma.attachment.findMany({
      where: {
        taskId: taskId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json(attachments);
  
});

export const POST = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ taskId: string }> }) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    if (!isValidFileSize(file.size, MAX_FILE_SIZE)) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Vercel Blob
    const fileUrl = await uploadToBlob(buffer, file.name, 'task-attachments');

    // Save attachment record to database
    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.name,
        fileUrl: fileUrl,
        taskId: taskId,
        uploadedBy: user.name,
      },
    });

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('POST mint_pms', duration);

  return NextResponse.json(attachment);
  
});

export const DELETE = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ taskId: string }> }) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get("attachmentId");

    if (!attachmentId) {
      return NextResponse.json(
        { error: "Attachment ID is required" },
        { status: 400 }
      );
    }

    // Verify attachment exists
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Delete attachment record
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    // Delete file from Blob storage
    await deleteFromBlob(attachment.fileUrl);

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('DELETE mint_pms', duration);

  return NextResponse.json({ success: true });
  
}); 