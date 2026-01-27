import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverAuth";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const POST = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Reset system settings to defaults
    try {
      await prisma.systemSettings.deleteMany({});
      await prisma.systemSettings.create({
        data: {
          settings: {
            projects: {
              defaultStatus: 'PLANNED',
              defaultBudget: '0',
              requireDescription: false,
              allowFileUpload: true,
              allowedFileTypes: ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png'],
              maxFileSize: 5,
              autoAssignProjectManager: false,
              requireBudgetApproval: true,
            },
            notifications: {
              projectUpdates: true,
              taskAssignments: true,
              budgetAlerts: true,
              deadlineReminders: true,
              newUserRegistration: true,
              projectCompletion: true,
              budgetOverruns: true,
              systemMaintenance: false,
            },
            display: {
              showProjectId: true,
              showCreationDate: true,
              showBudget: true,
              showHolder: true,
              showTeamMembers: true,
              showProgressBar: true,
              compactMode: false,
              darkMode: false,
            },
            system: {
              allowUserRegistration: true,
              requireEmailVerification: true,
              maxProjectsPerUser: 10,
              maxTeamMembersPerProject: 20,
              sessionTimeout: 24,
              backupFrequency: 'daily',
              enableAuditLog: true,
            }
          }
        }
      });
    } catch (error) {
      Logger.info('SystemSettings table not found:', error);
      return NextResponse.json(
        { error: 'Database not ready - please run: npx prisma db push' },
        { status: 500 }
      );
    }

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('POST mint_pms', duration);

  return NextResponse.json({ 
      success: true, 
      message: "Settings reset to defaults" 
    });
  
}); 