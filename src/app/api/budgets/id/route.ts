import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

const prisma = new PrismaClient();

export const GET = withErrorHandler(async (req: NextRequest,
  { params }: { params: Promise<{ id: string }> }) => {
  const startTime = Date.now();
  const { id } = await params;
  const budget = await prisma.budget.findUnique({
    where: { id },
    include: { project: true },
  });
  if (!budget)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json(budget);
});

export const PUT = withErrorHandler(async (req: NextRequest,
  { params }: { params: Promise<{ id: string }> }) => {
  const startTime = Date.now();
  const { id } = await params;
  const data = await req.json();
  const budget = await prisma.budget.update({
    where: { id },
    data: {
      ...data,
      date: new Date(data.date),
      allocation: parseFloat(data.allocation),
      expenses: parseFloat(data.expenses),
    },
  });
  
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('PUT mint_pms', duration);

  return NextResponse.json(budget);
});

export const DELETE = withErrorHandler(async (req: NextRequest,
  { params }: { params: Promise<{ id: string }> }) => {
  const startTime = Date.now();
  const { id } = await params;
  await prisma.budget.delete({ where: { id } });
  
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('DELETE mint_pms', duration);

  return NextResponse.json({ success: true });
});
