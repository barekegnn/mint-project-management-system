import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/serverAuth";
import { withErrorHandler } from "@/lib/api-error-handler";
import { Logger } from "@/lib/logger";
import { AuthenticationError } from "@/lib/errors";

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthenticationError("Not authenticated");
  }

  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('Get current user', duration);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
}); 