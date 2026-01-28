import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverAuth";
import { withErrorHandler } from "@/lib/api-error-handler";
import { Logger } from "@/lib/logger";
import { AuthenticationError, ValidationError } from "@/lib/errors";
import { parsePaginationParams, createPaginationResult, getPrismaPaginationOptions } from "@/lib/pagination";

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  const user = await getCurrentUser();
  
  if (!user) {
    throw new AuthenticationError("Unauthorized");
  }

  // Parse pagination parameters
  const { searchParams } = new URL(request.url);
  const { page, limit } = parsePaginationParams(searchParams);

  // Get total count for pagination
  const total = await prisma.notification.count({
    where: { userId: user.id },
  });

  // Only fetch notifications where the current user is the recipient
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      project: { 
        select: { 
          id: true, 
          name: true, 
          status: true 
        } 
      },
      user: { 
        select: { 
          id: true, 
          fullName: true, 
          role: true 
        } 
      }
    },
    ...getPrismaPaginationOptions(page, limit),
  });

  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('Fetch notifications', duration);

  // Return paginated response
  const result = createPaginationResult(notifications, total, page, limit);
  return NextResponse.json(result);
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