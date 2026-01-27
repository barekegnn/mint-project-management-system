import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const DELETE = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ taskId: string; attachmentId: string }> }) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId, attachmentId } = await params;

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

    // Verify the attachment belongs to the specified task
    if (attachment.taskId !== taskId) {
      return NextResponse.json(
        { error: "Attachment does not belong to this task" },
        { status: 400 }
      );
    }

    // Delete attachment record
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('DELETE mint_pms', duration);

  return NextResponse.json({ success: true });
  
}); 