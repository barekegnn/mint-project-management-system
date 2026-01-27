import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Verification token is required" },
      { status: 400 }
    );
  }

  try {
    // Find user with the verification token
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (
      user.verificationTokenExpires &&
      user.verificationTokenExpires < new Date()
    ) {
      return NextResponse.json(
        { error: "Verification token has expired" },
        { status: 400 }
      );
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    // Redirect to success page
    return NextResponse.redirect(new URL("/email-verified", request.url));
  } catch (error) {
    Logger.error("Error verifying email:", error);
    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
});
