import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const POST = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { content, recipientId } = await request.json();

    if (!content || !recipientId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify recipient exists and is a manager
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId }
    });

    if (!recipient || recipient.role !== "PROJECT_MANAGER") {
      return NextResponse.json(
        { error: "Recipient must be a project manager" },
        { status: 403 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: user.id,
        recipientId
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        recipient: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('POST mint_pms', duration);

  return NextResponse.json(message);
  
});

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "received"; // "sent" or "received"

    const messages = await prisma.message.findMany({
      where: {
        ...(type === "sent" ? { senderId: user.id } : { recipientId: user.id })
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        recipient: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json(messages);
  
}); 