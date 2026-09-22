import { NextResponse } from 'next/server';
import { isRequestAdminAuthenticated } from '@/lib/adminAuth';
import { getAnalyticsDashboardData, PeriodType, registerAdminIdentifier } from '@/lib/analyticsDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(request: Request) {
  // Server-side Authentication Guard
  const isAuthenticated = isRequestAdminAuthenticated(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { 
        error: 'Unauthorized: เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงข้อมูล Analytics ได้',
        authenticated: false 
      },
      { 
        status: 401,
        headers: NO_CACHE_HEADERS,
      }
    );
  }

  // Auto-register admin session identifier from request headers
  const reqSes = request.headers.get('x-session-id');
  if (reqSes) {
    try {
      await registerAdminIdentifier('session_id', reqSes);
    } catch (err) {
      console.warn('Failed to register admin session identifier:', err);
    }
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawPeriod = searchParams.get('period') || '7d';
    
    // Validate period parameter
    const validPeriods: PeriodType[] = ['today', '7d', '30d', '90d'];
    const period: PeriodType = validPeriods.includes(rawPeriod as PeriodType) 
      ? (rawPeriod as PeriodType) 
      : '7d';

    const data = await getAnalyticsDashboardData(period);

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        headers: NO_CACHE_HEADERS,
      }
    );
  } catch (error: any) {
    console.error('Failed to load analytics dashboard data:', error);
    return NextResponse.json(
      { 
        error: 'ไม่สามารถโหลดข้อมูลสถิติได้ กรุณาลองใหม่อีกครั้ง',
        debug: {
          message: error?.message || String(error),
          name: error?.name,
          envInfo: {
            hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
            databaseUrlLength: process.env.DATABASE_URL?.length || 0,
            hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
            hasPrismaUrl: Boolean(process.env.POSTGRES_PRISMA_URL),
            matchingEnvKeys: Object.keys(process.env).filter(
              k => k.includes('URL') || k.includes('DB') || k.includes('POSTGRES') || k.includes('DATA') || k.includes('SUPABASE')
            ),
            repoOwner: process.env.VERCEL_GIT_REPO_OWNER || null,
            repoSlug: process.env.VERCEL_GIT_REPO_SLUG || null,
            projectProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL || null,
            allAvailableKeyNames: Object.keys(process.env).sort(),
          }
        }
      },
      { 
        status: 500,
        headers: NO_CACHE_HEADERS,
      }
    );
  }
}
