import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { SECRET } from "@/lib/serverAuth";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    try {
      const payload = jwt.verify(token, SECRET) as { userId: string; newEmail: string };

      // Ensure target email not used
      const exists = await prisma.user.findUnique({ where: { email: payload.newEmail } });
      if (exists) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }

      // Update user email and mark emailVerified null until next verification if desired
      const updated = await prisma.user.update({
        where: { id: payload.userId },
        data: { email: payload.newEmail, emailVerified: new Date() },
        select: { id: true },
      });

      const appBase = process.env.NEXT_PUBLIC_APP_URL || `${new URL(request.url).protocol}//${new URL(request.url).host}`;
      return NextResponse.redirect(new URL(`/login?emailChanged=1`, appBase));
    } catch (e) {
      
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }
  
});


