import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProjectStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/serverAuth";
import { createProjectSchema } from "@/lib/validation-schemas";
import { getCacheHeader } from "@/lib/cache-headers";
import { withErrorHandler } from "@/lib/api-error-handler";
import { Logger } from "@/lib/logger";
import { AuthenticationError } from "@/lib/errors";

// GET: Fetch all projects, filter by holderId if provided
export const GET = withErrorHandler(async () => {
  const startTime = Date.now();
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new AuthenticationError("Unauthorized");
  }

  Logger.debug('Fetching projects', { userId: currentUser.id, role: currentUser.role });

  // If user is admin, fetch all projects. Otherwise, fetch only projects assigned to the user
  const whereClause = currentUser.role === 'ADMIN' 
    ? {} 
    : { holderId: currentUser.id };

  const projects = await prisma.project.findMany({
    where: whereClause,
    include: {
      holder: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true
        }
      },
      teams: {
        include: {
          members: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
      },
      tasks: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          deadline: true,
          assignedToId: true,
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
            }
          }
        }
      }
    },
  });

  // Log slow query if it takes more than 500ms
  const queryDuration = Date.now() - startTime;
  Logger.logSlowQuery('SELECT projects with includes', queryDuration);

  Logger.debug('Found projects', { count: projects.length });

  // Get team members created by the current user (for project managers)
  const createdTeamMembers = currentUser.role === 'PROJECT_MANAGER' 
    ? await prisma.user.findMany({
        where: {
          role: 'TEAM_MEMBER',
          createdBy: currentUser.id
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true
        }
      })
    : [];

  // Transform the data to match the frontend interface
  const transformedProjects = projects.map(project => {
    // Get team members from teams associated with this project
    const teamMembers = project.teams.flatMap(team => 
      team.members.map(member => {
        const memberTasks = project.tasks.filter(task => task.assignedToId === member.id);
        return {
          id: member.id,
          name: member.fullName,
          email: member.email,
          role: member.role,
          assignedTasks: memberTasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            deadline: task.deadline,
            assignedTo: task.assignedTo
          })),
          workload: memberTasks.length,
        };
      })
    );

    // Add team members created by the manager (if this is a project manager)
    const createdMembers = currentUser.role === 'PROJECT_MANAGER' 
      ? createdTeamMembers.map(member => {
          const memberTasks = project.tasks.filter(task => task.assignedToId === member.id);
          return {
            id: member.id,
            name: member.fullName,
            email: member.email,
            role: member.role,
            assignedTasks: memberTasks.map(task => ({
              id: task.id,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              deadline: task.deadline,
              assignedTo: task.assignedTo
            })),
            workload: memberTasks.length,
          };
        })
      : [];

    // Combine team members and created members, removing duplicates
    const allMembers = [...teamMembers, ...createdMembers];
    const uniqueMembers = allMembers.filter((member, index, self) => 
      index === self.findIndex(m => m.id === member.id)
    );

    return {
      id: project.id,
      name: project.name,
      description: project.description || '',
      budget: project.budget,
      status: project.status,
      holder: project.holder?.fullName || 'Unassigned',
      holderId: project.holderId,
      holderEmail: project.holder?.email || '',
      updatedAt: project.updatedAt ? new Date(project.updatedAt).toISOString() : null,
      createdAt: project.createdAt ? new Date(project.createdAt).toISOString() : null,
      totalTasks: project.tasks.length,
      completedTasks: project.tasks.filter(task => task.status === 'COMPLETED').length,
      members: uniqueMembers,
    };
  });

  return NextResponse.json({ projects: transformedProjects }, {
    headers: {
      'Cache-Control': getCacheHeader('stale-while-revalidate'), // Cache but revalidate in background
    },
  });
});

// POST: Create a new project
export const POST = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  const body = await request.json();

  // Validate input with Zod
  const validatedData = createProjectSchema.parse(body);
  let { name, holderId, budget, description, status } = validatedData;

  // Convert budget to number if it's a string
  const budgetNumber = typeof budget === 'string' ? Number(budget) : budget;

  // Confirm holder (user) exists and has appropriate role
  const user = await prisma.user.findUnique({
    where: { id: holderId }
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid holder ID" }, { status: 400 });
  }

  // Create project
  const project = await prisma.project.create({
    data: {
      name,
      holder: { connect: { id: user.id } },
      status: status || ProjectStatus.PLANNED,
      budget: String(budgetNumber),
      description: description || null,
      fileName: null,
      fileUrl: null,
    },
  });

  // Get the current user (admin) who is creating the project
  const currentUser = await getCurrentUser();
  
  // Create notification for admin only (project creation)
  if (currentUser) {
    await prisma.notification.create({
      data: {
        type: "PROJECT_CREATED",
        message: `Project "${name}" has been created and assigned to ${user.fullName}`,
        userId: currentUser.id, // Notify the admin who created it
        projectId: project.id,
      },
    });
  }

  // Create notification for project manager (project assignment)
  await prisma.notification.create({
    data: {
      type: "PROJECT_ASSIGNED",
      message: `You have been assigned to manage project "${name}"`,
      userId: user.id, // Notify the project manager
      projectId: project.id,
    },
  });

  // Log slow query if it takes more than 500ms
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('INSERT project with notifications', duration);

  Logger.info("Project created", { projectId: project.id, name: project.name, holderId: user.id });

  return NextResponse.json({
    project: {
      ...project,
      holder: user.fullName,
    },
  }, { status: 201 });
});
