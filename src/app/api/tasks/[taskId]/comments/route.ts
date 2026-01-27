import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ taskId: string }> }) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await params;

    const comments = await prisma.comment.findMany({
      where: {
        taskId: taskId,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json(comments);
  
});

export const POST = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ taskId: string }> }) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        taskId: taskId,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('POST mint_pms', duration);

  return NextResponse.json(comment);
  
}); 