import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverAuth";
import { Role } from "@prisma/client";
import { withErrorHandler } from "@/lib/api-error-handler";
import { Logger } from "@/lib/logger";

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') as Role | null;

  const users = await prisma.user.findMany({
    where: role ? { role } : undefined,
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
    },
  });

  // Log slow query if it takes more than 500ms
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('SELECT users', duration);

  return NextResponse.json({ users });
}); 