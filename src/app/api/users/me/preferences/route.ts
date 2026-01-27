import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/serverAuth";
import prisma from "@/lib/prisma";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

// Default user preferences
const defaultPreferences = {
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    projectUpdates: true,
    taskAssignments: true,
    deadlineReminders: true,
    weeklyDigest: false,
  },
  display: {
    theme: 'light',
    compactMode: false,
    showProgressBars: true,
    showTimestamps: true,
  },
  privacy: {
    showEmail: false,
    showPhone: false,
    allowDirectMessages: true,
    showOnlineStatus: true,
  }
};

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Preferences field doesn't exist in schema - return default preferences
    const preferences = defaultPreferences;

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json({ preferences });
  
});

export const PUT = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json({ 
        error: "Preferences data is required" 
      }, { status: 400 });
    }

    // Preferences field doesn't exist in schema - return not implemented
    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('PUT mint_pms', duration);

  return NextResponse.json({ 
      error: "User preferences feature not yet implemented" 
    }, { status: 501 });

  
}); 