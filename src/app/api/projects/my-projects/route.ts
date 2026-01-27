import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        };
      },
    }),
  ],
};

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch projects where the current user is the holder
    const projects = await prisma.project.findMany({
      where: {
        holderId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match the expected format
    const formattedProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      holderId: project.holderId,
      status: project.status,
      budget: project.budget,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }));

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json(formattedProjects);
  
}); 