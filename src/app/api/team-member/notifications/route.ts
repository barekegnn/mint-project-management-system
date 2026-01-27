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

  // Get all notifications for the team member
  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id
    },
    orderBy: {
      createdAt: "desc"
    },
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
          email: true
        }
      }
    }
  });

  return NextResponse.json(notifications);
});

// Mark notification as read
export const PATCH = withErrorHandler(async (request: Request) => {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { notificationId } = await request.json();

  const notification = await prisma.notification.update({
    where: {
      id: notificationId,
      userId: user.id
    },
    data: {
      isRead: true
    }
  });

  return NextResponse.json(notification);
}); 