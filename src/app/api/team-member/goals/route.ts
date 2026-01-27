import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverAuth";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Goal model doesn't exist in schema - return empty array for now
    return NextResponse.json([]);
  } catch (error) {
    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
});

export const POST = withErrorHandler(async (req: Request) => {
  const startTime = Date.now();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Goal model doesn't exist in schema - return not implemented
    return NextResponse.json({ error: "Goals feature not yet implemented" }, { status: 501 });
  } catch (error) {
    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('POST mint_pms', duration);

  return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}); 