import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        fullName: true,
        email: true,
        role: true,
        profileImageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json({ user: dbUser });
  
});

export const PUT = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const body = await request.json();
    const { fullName, profileImageUrl } = body;
    if (!fullName) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }

    const updateData: any = { fullName };
    if (typeof profileImageUrl === 'string') {
      updateData.profileImageUrl = profileImageUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        fullName: true,
        email: true,
        role: true,
        profileImageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('PUT mint_pms', duration);

  return NextResponse.json({ user: updatedUser });
  
}); 