import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverAuth";
import { withErrorHandler } from "@/lib/api-error-handler";
import { Logger } from "@/lib/logger";
import { AuthenticationError, ValidationError } from "@/lib/errors";

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  const user = await getCurrentUser();
  
  if (!user) {
    throw new AuthenticationError("Unauthorized");
  }

  // Only fetch notifications where the current user is the recipient
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { id: true, name: true, status: true } },
      user: { select: { id: true, fullName: true, role: true } }
    },
    take: 50
  });

  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('Fetch notifications', duration);

  return NextResponse.json(notifications);
});

export const POST = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  const { id } = await request.json();
  
  if (!id) {
    throw new ValidationError('Notification ID is required');
  }

  const notification = await prisma.notification.update({
    where: { id },
    data: { isRead: true }
  });

  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('Mark notification as read', duration);

  return NextResponse.json(notification);
}); 