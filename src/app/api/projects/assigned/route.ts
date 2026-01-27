import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverAuth";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    Logger.info("Current user:", {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Fetch projects for this user
    const userProjects = await prisma.$queryRaw`
      SELECT * FROM "Project"
      WHERE "holderId" = ${user.id}
      ORDER BY "createdAt" DESC
    `;

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json(userProjects);
  
});
