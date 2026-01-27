import { NextResponse } from "next/server";
import { serialize } from "cookie";
import { withErrorHandler } from "@/lib/api-error-handler";
import { Logger } from "@/lib/logger";

export const POST = withErrorHandler(async (request: Request) => {
  const response = NextResponse.json({ message: "Logged out successfully" });

  // Clear the auth cookie
  response.headers.set(
    "Set-Cookie",
    serialize("token", "", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
    })
  );

  Logger.info("User logged out");

  return response;
}); 