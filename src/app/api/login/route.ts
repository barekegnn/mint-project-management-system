import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import { serialize } from "cookie";
import { withErrorHandler } from "@/lib/api-error-handler";
import { Logger } from "@/lib/logger";
import { AuthenticationError } from "@/lib/errors";

const SECRET = process.env.JWT_SECRET || "your-secret"; // put this in .env

export const POST = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  const { email, password } = await request.json();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AuthenticationError("Invalid credentials");
  }

  Logger.info("User logged in", { userId: user.id, email: user.email });

  // Create JWT
  const token = sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      name: user.fullName // Include name in JWT
    },
    SECRET,
    { expiresIn: "1h" }
  );

  // Set cookie
  const response = NextResponse.json({
    message: "Login successful",
    user: {
      id: user.id,
      name: user.fullName, // Use fullName as name
      role: user.role,
    },
  });

  response.headers.set(
    "Set-Cookie",
    serialize("token", token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
    })
  );

  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('User login', duration);

  return response;
});
