import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    const managers = await prisma.user.findMany({
      where: { role: "PROJECT_MANAGER" },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        activatedAt: true,
      },
      orderBy: { fullName: "asc" },
    });
    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json({ users: managers });
  
});
