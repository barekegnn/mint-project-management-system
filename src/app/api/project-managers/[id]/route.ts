import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ id: string }> }) => {
  const startTime = Date.now();
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 });
    }
    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json({ user });
  
});

export const PUT = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ id: string }> }) => {
  const startTime = Date.now();
    const body = await request.json();
    const { fullName, email } = body;
    const { id } = await params;
    const user = await prisma.user.update({
      where: { id },
      data: { fullName, email },
    });
    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('PUT mint_pms', duration);

  return NextResponse.json({ user });
  
});

export const DELETE = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ id: string }> }) => {
  const startTime = Date.now();
    const { id } = await params;
    
    // First check if the user exists
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        projectsManaged: true,
        assignedTasks: true,
        notifications: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has related data that would prevent deletion
    if (user.projectsManaged.length > 0) {
      return NextResponse.json({ 
        error: `Cannot delete user. They are managing ${user.projectsManaged.length} project(s). Please reassign or delete these projects first.` 
      }, { status: 400 });
    }

    if (user.assignedTasks.length > 0) {
      return NextResponse.json({ 
        error: `Cannot delete user. They have ${user.assignedTasks.length} assigned task(s). Please reassign these tasks first.` 
      }, { status: 400 });
    }

    // Delete related notifications first (if any)
    if (user.notifications.length > 0) {
      await prisma.notification.deleteMany({
        where: { userId: id }
      });
    }

    // Now delete the user
    await prisma.user.delete({ where: { id } });
    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('DELETE mint_pms', duration);

  return NextResponse.json({ message: "Manager deleted successfully" });
  
});
