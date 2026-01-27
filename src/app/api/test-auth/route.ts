import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/serverAuth';
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ 
        authenticated: false, 
        message: 'No user found' 
      });
    }

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });

  
}); 