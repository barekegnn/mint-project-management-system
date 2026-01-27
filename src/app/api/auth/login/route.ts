import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { withErrorHandler } from "@/lib/api-error-handler";
import { AuthenticationError } from "@/lib/errors";
import { Logger } from "@/lib/logger";
import { loginSchema } from "@/lib/validation-schemas";

export const POST = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  const body = await request.json();

  // Validate input with Zod
  const validatedData = loginSchema.parse(body);
  const { email, password } = validatedData;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      role: true,
      fullName: true,
      status: true,
    },
  });

  if (!user) {
    throw new AuthenticationError("Invalid email or password");
  }

  // Check if user is activated
  if (user.status !== "ACTIVE") {
    throw new AuthenticationError(
      "Account not activated. Please check your email for activation link."
    );
  }

  // Check if user has a password
  if (!user.password) {
    throw new AuthenticationError(
      "Account not properly set up. Please contact administrator."
    );
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new AuthenticationError("Invalid email or password");
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "1d" }
  );

  // Log successful login
  const duration = Date.now() - startTime;
  Logger.logRequest('POST', '/api/auth/login', 200, duration);
  Logger.info('User logged in', { userId: user.id, email: user.email });

  // Return user data and token
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    token,
  });
});
