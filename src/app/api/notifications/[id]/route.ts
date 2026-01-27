import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const DELETE = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ id: string }> }) => {
  const startTime = Date.now();
    const { id } = await params;
    // Validate the notification ID
    if (!id) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Check if notification exists
    const notification = await prisma.notification.findUnique({
      where: {
        id
      }
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Delete the notification
    await prisma.notification.delete({
      where: {
        id
      }
    });

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('DELETE mint_pms', duration);

  return NextResponse.json(
      { message: "Notification deleted successfully" },
      { status: 200 }
    );
  
}); 