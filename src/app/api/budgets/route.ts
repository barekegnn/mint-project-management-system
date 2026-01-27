import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  
  const budgets = await prisma.budget.findMany({
    include: {
      project: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('Fetch budgets', duration);

  return NextResponse.json({ budgets });
});

export const POST = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  const body = await request.json();
  const { projectId, allocation, expenses, status, date, department } = body;

  const budget = await prisma.budget.create({
    data: {
      projectId,
      department: department || 'General',
      allocation: parseFloat(allocation),
      expenses: parseFloat(expenses),
      status,
      date: new Date(date),
    },
    include: {
      project: {
        select: {
          name: true,
        },
      },
    },
  });

  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('Create budget', duration);

  return NextResponse.json({ budget });
}); 