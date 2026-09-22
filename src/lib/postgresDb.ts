import { Pool, PoolClient } from 'pg';
import fs from 'fs';
import path from 'path';
import {
  AnalyticsEventInput,
  StoredAnalyticsEvent,
  AnalyticsSummary,
  TimelineDataPoint,
  TopDormitory,
  TopSearch,
  AnalyticsResetRecord,
  AdminAuditLogRecord,
  HistoricalPeriod,
  PeriodType,
  AnalyticsDashboardData,
} from './analyticsDb';

let pool: Pool | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

export function cleanConnectionString(str?: string | null): string | null {
  if (!str) return null;
  let cleaned = str.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) || 
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned || null;
}

export function getPostgresConnectionString(): string | null {
  const raw = 
    process.env.DATABASE_URL || 
    process.env.POSTGRES_URL || 
    process.env.POSTGRES_PRISMA_URL || 
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.SUPABASE_DB_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.database_url;
  return cleanConnectionString(raw);
}

export function isPostgresConfigured(): boolean {
  return Boolean(getPostgresConnectionString());
}

export function getPgPool(): Pool | null {
  if (pool) return pool;
  const connectionString = getPostgresConnectionString();
  if (!connectionString) return null;

  try {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
        ? false
        : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL Pool Error:', err);
    });

    return pool;
  } catch (err) {
    console.error('[PostgreSQL] Failed to instantiate Pool:', err);
    return null;
  }
}

let lastInitError: string | null = null;
let lastQueryError: string | null = null;

/**
 * Ensure PostgreSQL schema exists and run one-time historical migration if empty
 */
export async function ensurePostgresInitialized(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const p = getPgPool();
    if (!p) {
      lastInitError = 'Pool is not available';
      return;
    }

    try {
      await p.query(`
        CREATE TABLE IF NOT EXISTS analytics_events (
          id BIGSERIAL PRIMARY KEY,
          event_name VARCHAR(50) NOT NULL,
          session_id VARCHAR(64) NOT NULL,
          visitor_id VARCHAR(64) NOT NULL,
          actor_type VARCHAR(20) DEFAULT 'user',
          user_id VARCHAR(64),
          page VARCHAR(255),
          dormitory_id INTEGER,
          dormitory_name VARCHAR(150),
          search_keyword VARCHAR(255),
          metadata JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS analytics_reset_history (
          id BIGSERIAL PRIMARY KEY,
          reset_at TIMESTAMPTZ NOT NULL,
          created_by VARCHAR(100) NOT NULL DEFAULT 'admin',
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          note TEXT
        );

        CREATE TABLE IF NOT EXISTS admin_identifiers (
          id BIGSERIAL PRIMARY KEY,
          identifier_type VARCHAR(50) NOT NULL,
          identifier_value VARCHAR(100) NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS admin_audit_logs (
          id BIGSERIAL PRIMARY KEY,
          admin_id VARCHAR(100) NOT NULL,
          action VARCHAR(100) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          metadata JSONB
        );

        CREATE TABLE IF NOT EXISTS analytics_settings (
          key VARCHAR(100) PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_events_event_name ON analytics_events(event_name);
        CREATE INDEX IF NOT EXISTS idx_events_created_at ON analytics_events(created_at);
        CREATE INDEX IF NOT EXISTS idx_events_session_id ON analytics_events(session_id);
        CREATE INDEX IF NOT EXISTS idx_events_visitor_id ON analytics_events(visitor_id);
        CREATE INDEX IF NOT EXISTS idx_events_dormitory_id ON analytics_events(dormitory_id);
        CREATE INDEX IF NOT EXISTS idx_events_actor_type ON analytics_events(actor_type);
        CREATE INDEX IF NOT EXISTS idx_reset_reset_at ON analytics_reset_history(reset_at);
        CREATE INDEX IF NOT EXISTS idx_admin_id_type_val ON admin_identifiers(identifier_type, identifier_value);
        CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_logs(action);
        CREATE INDEX IF NOT EXISTS idx_audit_created_at ON admin_audit_logs(created_at);
      `);

      // One-time automatic migration of Reset History if table is empty
      const countRes = await p.query('SELECT COUNT(*) as c FROM analytics_reset_history');
      const resetCount = parseInt(countRes.rows[0]?.c || '0', 10);

      if (resetCount === 0) {
        console.log('[PostgreSQL] Empty analytics_reset_history detected. Initiating migration from bundled seed...');
        let seedRecords: any[] = [];

        // Check bundled JSON files in order of priority
        const candidatePaths = [
          path.join(process.cwd(), 'data', 'analytics_reset_history.prod.json'),
          path.join(process.cwd(), 'data', 'analytics_reset_history.dev.json'),
        ];

        for (const candidate of candidatePaths) {
          if (fs.existsSync(candidate)) {
            try {
              const raw = fs.readFileSync(candidate, 'utf-8');
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                seedRecords = parsed;
                console.log(`[PostgreSQL] Loaded ${seedRecords.length} reset records from ${path.basename(candidate)}`);
                break;
              }
            } catch (err) {
              console.warn('[PostgreSQL] Failed to read seed file:', candidate, err);
            }
          }
        }

        if (seedRecords.length > 0) {
          for (const rec of seedRecords) {
            if (rec && rec.resetAt) {
              await p.query(
                `INSERT INTO analytics_reset_history (reset_at, created_by, created_at, note)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT DO NOTHING`,
                [
                  new Date(rec.resetAt).toISOString(),
                  rec.createdBy || 'admin',
                  new Date(rec.createdAt || rec.resetAt).toISOString(),
                  rec.note || null,
                ]
              );
            }
          }
          console.log(`[PostgreSQL] Migration completed: ${seedRecords.length} records populated.`);
        }
      }

      isInitialized = true;
      lastInitError = null;
    } catch (err: any) {
      lastInitError = err?.message || String(err);
      console.error('[PostgreSQL] Initialization Error:', err);
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export async function pgDiagnosticCheck() {
  const connStr = getPostgresConnectionString();
  const p = getPgPool();
  if (!p) {
    return { ok: false, error: 'Pool is null', hasConnStr: Boolean(connStr) };
  }

  let client: PoolClient | null = null;
  try {
    client = await p.connect();
    const versionRes = await client.query('SELECT version()');
    
    // Check tables in public schema
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tables = tablesRes.rows.map(r => r.table_name);

    // Try ensuring initialized
    let initErr = null;
    try {
      await ensurePostgresInitialized();
    } catch (ie: any) {
      initErr = ie?.message || String(ie);
    }

    let eventsCount = -1;
    let resetCount = -1;
    let auditCount = -1;
    let eventsErr = null;

    try {
      const e = await client.query('SELECT COUNT(*) as c FROM analytics_events');
      eventsCount = parseInt(e.rows[0]?.c, 10);
    } catch (ee: any) {
      eventsErr = ee?.message || String(ee);
    }

    try {
      const r = await client.query('SELECT COUNT(*) as c FROM analytics_reset_history');
      resetCount = parseInt(r.rows[0]?.c, 10);
    } catch {}

    try {
      const a = await client.query('SELECT COUNT(*) as c FROM admin_audit_logs');
      auditCount = parseInt(a.rows[0]?.c, 10);
    } catch {}

    return {
      ok: true,
      version: versionRes.rows[0]?.version,
      tables,
      eventsCount,
      resetCount,
      auditCount,
      initErr,
      eventsErr,
      lastInitError,
      lastQueryError,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || String(err),
      code: err?.code,
      name: err?.name,
    };
  } finally {
    if (client) {
      try { client.release(); } catch {}
    }
  }
}

/**
 * Register an admin identifier in PostgreSQL
 */
export async function pgRegisterAdminIdentifier(type: 'session_id' | 'visitor_id', value: string): Promise<void> {
  if (!value || typeof value !== 'string') return;
  const cleanVal = value.trim();
  if (!cleanVal) return;

  await ensurePostgresInitialized();
  const p = getPgPool();
  if (!p) return;

  try {
    await p.query(
      `INSERT INTO admin_identifiers (identifier_type, identifier_value, created_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (identifier_value) DO NOTHING`,
      [type, cleanVal, new Date().toISOString()]
    );

    // Retroactively exclude previous events in this session
    if (type === 'session_id') {
      await p.query(
        `UPDATE analytics_events 
         SET actor_type = 'admin' 
         WHERE session_id = $1 AND (actor_type != 'admin' OR actor_type IS NULL)`,
        [cleanVal]
      );
    }
  } catch (err) {
    console.error('[PostgreSQL] pgRegisterAdminIdentifier error:', err);
  }
}

/**
 * Check if a given sessionId belongs to a known admin session
 */
export async function pgIsKnownAdminIdentifier(sessionId?: string | null): Promise<boolean> {
  if (!sessionId) return false;
  await ensurePostgresInitialized();
  const p = getPgPool();
  if (!p) return false;

  try {
    const res = await p.query(
      `SELECT 1 FROM admin_identifiers WHERE identifier_type = 'session_id' AND identifier_value = $1 LIMIT 1`,
      [sessionId]
    );
    return res.rowCount !== null && res.rowCount > 0;
  } catch {
    return false;
  }
}

/**
 * Log administrative audit action in PostgreSQL
 */
export async function pgLogAdminAudit(
  adminId: string,
  action: string,
  metadata?: Record<string, any> | null
): Promise<AdminAuditLogRecord> {
  await ensurePostgresInitialized();
  const p = getPgPool();
  const now = new Date().toISOString();

  if (!p) {
    return { id: 0, adminId, action, createdAt: now, metadata: metadata || null };
  }

  try {
    const res = await p.query(
      `INSERT INTO admin_audit_logs (admin_id, action, created_at, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING id, admin_id, action, created_at, metadata`,
      [adminId, action, now, metadata ? JSON.stringify(metadata) : null]
    );
    const row = res.rows[0];
    return {
      id: Number(row.id),
      adminId: row.admin_id,
      action: row.action,
      createdAt: new Date(row.created_at).toISOString(),
      metadata: row.metadata || null,
    };
  } catch (err) {
    console.error('[PostgreSQL] pgLogAdminAudit error:', err);
    return { id: 0, adminId, action, createdAt: now, metadata: metadata || null };
  }
}

/**
 * Retrieve recent administrative audit logs from PostgreSQL
 */
export async function pgGetAdminAuditLogs(limit = 100): Promise<AdminAuditLogRecord[]> {
  await ensurePostgresInitialized();
  const p = getPgPool();
  if (!p) return [];

  try {
    const res = await p.query(
      `SELECT id, admin_id, action, created_at, metadata
       FROM admin_audit_logs
       ORDER BY id DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows.map((r) => ({
      id: Number(r.id),
      adminId: String(r.admin_id),
      action: String(r.action),
      createdAt: new Date(r.created_at).toISOString(),
      metadata: r.metadata || null,
    }));
  } catch (err) {
    console.error('[PostgreSQL] pgGetAdminAuditLogs error:', err);
    return [];
  }
}

/**
 * Record an analytics event into PostgreSQL
 */
export async function pgRecordEvent(event: AnalyticsEventInput): Promise<StoredAnalyticsEvent | null> {
  if (event.actorType === 'admin') return null;

  await ensurePostgresInitialized();
  const p = getPgPool();
  if (!p) return null;

  // Verify session is not a known admin session
  if (event.sessionId) {
    const isAdmin = await pgIsKnownAdminIdentifier(event.sessionId);
    if (isAdmin) return null;
  }

  const effectiveActorType = event.actorType || (event.userId ? 'user' : 'anonymous');
  const createdAt = event.createdAt || new Date().toISOString();

  try {
    // Server-side Idempotency & Deduplication (Requirement 11, 12):
    // Prevent duplicate inserts within 2 seconds for identical user action in the same session
    const dupCheck = await p.query(
      `SELECT id, event_name, session_id, visitor_id, actor_type, user_id, page, dormitory_id, dormitory_name, search_keyword, metadata, created_at 
       FROM analytics_events 
       WHERE session_id = $1 
         AND event_name = $2 
         AND (page = $3 OR ($3 IS NULL AND page IS NULL))
         AND (dormitory_id = $4 OR ($4 IS NULL AND dormitory_id IS NULL))
         AND (search_keyword = $5 OR ($5 IS NULL AND search_keyword IS NULL))
         AND created_at >= NOW() - INTERVAL '2 seconds'
       LIMIT 1`,
      [
        event.sessionId,
        event.eventName,
        event.page || null,
        event.dormitoryId || null,
        event.searchKeyword ? event.searchKeyword.trim() : null,
      ]
    );

    if (dupCheck.rows.length > 0) {
      const dup = dupCheck.rows[0];
      return {
        id: Number(dup.id),
        eventName: dup.event_name,
        sessionId: dup.session_id,
        visitorId: dup.visitor_id,
        actorType: dup.actor_type,
        userId: dup.user_id,
        page: dup.page,
        dormitoryId: dup.dormitory_id,
        dormitoryName: dup.dormitory_name,
        searchKeyword: dup.search_keyword,
        metadata: dup.metadata ? JSON.stringify(dup.metadata) : null,
        createdAt: new Date(dup.created_at).toISOString(),
      };
    }

    const res = await p.query(
      `INSERT INTO analytics_events
       (event_name, session_id, visitor_id, actor_type, user_id, page, dormitory_id, dormitory_name, search_keyword, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, event_name, session_id, visitor_id, actor_type, user_id, page, dormitory_id, dormitory_name, search_keyword, metadata, created_at`,
      [
        event.eventName,
        event.sessionId,
        event.visitorId,
        effectiveActorType,
        event.userId || null,
        event.page || null,
        event.dormitoryId || null,
        event.dormitoryName || null,
        event.searchKeyword || null,
        event.metadata ? JSON.stringify(event.metadata) : null,
        createdAt,
      ]
    );

    const r = res.rows[0];
    return {
      id: Number(r.id),
      eventName: r.event_name,
      sessionId: r.session_id,
      visitorId: r.visitor_id,
      actorType: r.actor_type,
      userId: r.user_id,
      page: r.page,
      dormitoryId: r.dormitory_id,
      dormitoryName: r.dormitory_name,
      searchKeyword: r.search_keyword,
      metadata: r.metadata ? JSON.stringify(r.metadata) : null,
      createdAt: new Date(r.created_at).toISOString(),
    };
  } catch (err: any) {
    lastQueryError = err?.message || String(err);
    console.error('[PostgreSQL] pgRecordEvent error:', err);
    return null;
  }
}

/**
 * Get latest reset timestamp from PostgreSQL
 */
export async function pgGetDisplayResetTimestamp(): Promise<string | null> {
  await ensurePostgresInitialized();
  const p = getPgPool();
  if (!p) return null;

  try {
    const res = await p.query(
      `SELECT reset_at FROM analytics_reset_history ORDER BY reset_at DESC LIMIT 1`
    );
    if (res.rows.length > 0 && res.rows[0].reset_at) {
      return new Date(res.rows[0].reset_at).toISOString();
    }
    return null;
  } catch (err) {
    console.error('[PostgreSQL] pgGetDisplayResetTimestamp error:', err);
    return null;
  }
}

/**
 * Get full list of reset records from PostgreSQL
 */
export async function pgGetResetHistory(): Promise<AnalyticsResetRecord[]> {
  await ensurePostgresInitialized();
  const p = getPgPool();
  if (!p) return [];

  try {
    const res = await p.query(
      `SELECT id, reset_at, created_by, created_at, note
       FROM analytics_reset_history
       ORDER BY reset_at DESC`
    );
    return res.rows.map((r) => ({
      id: Number(r.id),
      resetAt: new Date(r.reset_at).toISOString(),
      createdBy: String(r.created_by || 'admin'),
      createdAt: new Date(r.created_at).toISOString(),
      note: r.note ? String(r.note) : null,
    }));
  } catch (err) {
    console.error('[PostgreSQL] pgGetResetHistory error:', err);
    return [];
  }
}

/**
 * Create a new Reset record in PostgreSQL (Zero data loss: NEVER deletes events)
 */
export async function pgCreateResetRecord(createdBy = 'admin', note?: string): Promise<AnalyticsResetRecord> {
  await ensurePostgresInitialized();
  const p = getPgPool();
  const now = new Date().toISOString();

  if (!p) {
    return { id: 0, resetAt: now, createdBy, createdAt: now, note: note || null };
  }

  try {
    const res = await p.query(
      `INSERT INTO analytics_reset_history (reset_at, created_by, created_at, note)
       VALUES ($1, $2, $3, $4)
       RETURNING id, reset_at, created_by, created_at, note`,
      [now, createdBy, now, note || null]
    );

    // Update settings table
    await p.query(
      `INSERT INTO analytics_settings (key, value, updated_at)
       VALUES ('analytics_display_reset_at', $1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = $2`,
      [now, now]
    );

    const r = res.rows[0];
    return {
      id: Number(r.id),
      resetAt: new Date(r.reset_at).toISOString(),
      createdBy: String(r.created_by),
      createdAt: new Date(r.created_at).toISOString(),
      note: r.note ? String(r.note) : null,
    };
  } catch (err) {
    console.error('[PostgreSQL] pgCreateResetRecord error:', err);
    return { id: 0, resetAt: now, createdBy, createdAt: now, note: note || null };
  }
}

/**
 * Date range calculation (Asia/Bangkok)
 */
function getPeriodDateRanges(period: PeriodType) {
  const now = new Date();
  let currentStart: Date;
  let prevStart: Date;
  let prevEnd: Date;

  if (period === 'today') {
    const nowBkk = new Date(now.getTime() + BANGKOK_OFFSET_MS);
    const startOfTodayBkkUtcMs =
      Date.UTC(nowBkk.getUTCFullYear(), nowBkk.getUTCMonth(), nowBkk.getUTCDate(), 0, 0, 0) -
      BANGKOK_OFFSET_MS;
    currentStart = new Date(startOfTodayBkkUtcMs);
    prevEnd = new Date(currentStart.getTime() - 1);
    prevStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
  } else if (period === '7d') {
    currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    prevEnd = new Date(currentStart.getTime());
    prevStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === '30d') {
    currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    prevEnd = new Date(currentStart.getTime());
    prevStart = new Date(currentStart.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else {
    // 90d
    currentStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    prevEnd = new Date(currentStart.getTime());
    prevStart = new Date(currentStart.getTime() - 90 * 24 * 60 * 60 * 1000);
  }

  return {
    currentStart: currentStart.toISOString(),
    currentEnd: now.toISOString(),
    prevStart: prevStart.toISOString(),
    prevEnd: prevEnd.toISOString(),
  };
}

function applyResetToRange(
  start: string,
  end: string,
  resetAt: string | null
): { start: string; end: string; isValid: boolean } {
  if (!resetAt) {
    return { start, end, isValid: new Date(start).getTime() <= new Date(end).getTime() };
  }

  const resetTime = new Date(resetAt).getTime();
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (endTime < resetTime) {
    return { start, end, isValid: false };
  }

  const effectiveStart = startTime < resetTime ? resetAt : start;
  return {
    start: effectiveStart,
    end,
    isValid: new Date(effectiveStart).getTime() <= endTime,
  };
}

function calculatePercentChange(current: number, prev: number, isPrevValid = true): number | null {
  if (!isPrevValid || prev === 0) return null;
  const change = ((current - prev) / prev) * 100;
  return Math.round(change * 10) / 10;
}

/**
 * Get Analytics Summary from PostgreSQL
 */
export async function pgGetAnalyticsSummary(period: PeriodType): Promise<AnalyticsSummary> {
  await ensurePostgresInitialized();
  const p = getPgPool();
  const emptySummary: AnalyticsSummary = {
    uniqueVisitors: { value: 0, prevValue: 0, changePercent: null },
    pageViews: { value: 0, prevValue: 0, changePercent: null },
    searchEvents: { value: 0, prevValue: 0, changePercent: null },
    dormitoryViews: { value: 0, prevValue: 0, changePercent: null },
  };
  if (!p) return emptySummary;

  const { currentStart, currentEnd, prevStart, prevEnd } = getPeriodDateRanges(period);
  const resetAt = await pgGetDisplayResetTimestamp();

  const currRange = applyResetToRange(currentStart, currentEnd, resetAt);
  const prevRange = applyResetToRange(prevStart, prevEnd, resetAt);
  const isPrevValid = prevRange.isValid && new Date(prevRange.start).getTime() <= new Date(prevRange.end).getTime();

  const getCounts = async (range: { start: string; end: string; isValid: boolean }) => {
    if (!range.isValid) {
      return { uniqueVisitors: 0, pageViews: 0, searchEvents: 0, dormitoryViews: 0 };
    }
    const res = await p.query(
      `SELECT 
         COUNT(DISTINCT visitor_id) as unique_visitors,
         COUNT(DISTINCT session_id) as page_views,
         SUM(CASE WHEN event_name = 'search' THEN 1 ELSE 0 END) as search_events,
         SUM(CASE WHEN event_name = 'dormitory_view' THEN 1 ELSE 0 END) as dorm_views
       FROM analytics_events
       WHERE created_at >= $1 AND created_at <= $2
         AND (actor_type IS NULL OR actor_type != 'admin')
         AND (user_id IS NULL OR user_id != 'admin')
         AND session_id NOT IN (
           SELECT identifier_value FROM admin_identifiers 
           WHERE identifier_type = 'session_id' AND identifier_value IS NOT NULL
         )`,
      [range.start, range.end]
    );
    const row = res.rows[0];
    return {
      uniqueVisitors: parseInt(row?.unique_visitors || '0', 10),
      pageViews: parseInt(row?.page_views || '0', 10),
      searchEvents: parseInt(row?.search_events || '0', 10),
      dormitoryViews: parseInt(row?.dorm_views || '0', 10),
    };
  };

  try {
    const current = await getCounts(currRange);
    const prev = await getCounts(prevRange);

    return {
      uniqueVisitors: {
        value: current.uniqueVisitors,
        prevValue: isPrevValid ? prev.uniqueVisitors : 0,
        changePercent: calculatePercentChange(current.uniqueVisitors, prev.uniqueVisitors, isPrevValid),
      },
      pageViews: {
        value: current.pageViews,
        prevValue: isPrevValid ? prev.pageViews : 0,
        changePercent: calculatePercentChange(current.pageViews, prev.pageViews, isPrevValid),
      },
      searchEvents: {
        value: current.searchEvents,
        prevValue: isPrevValid ? prev.searchEvents : 0,
        changePercent: calculatePercentChange(current.searchEvents, prev.searchEvents, isPrevValid),
      },
      dormitoryViews: {
        value: current.dormitoryViews,
        prevValue: isPrevValid ? prev.dormitoryViews : 0,
        changePercent: calculatePercentChange(current.dormitoryViews, prev.dormitoryViews, isPrevValid),
      },
    };
  } catch (err) {
    console.error('[PostgreSQL] pgGetAnalyticsSummary error:', err);
    return emptySummary;
  }
}

/**
 * Get Timeline Data from PostgreSQL
 */
export async function pgGetTimelineData(period: PeriodType): Promise<TimelineDataPoint[]> {
  await ensurePostgresInitialized();
  const p = getPgPool();
  if (!p) return [];

  const { currentStart, currentEnd } = getPeriodDateRanges(period);
  const resetAt = await pgGetDisplayResetTimestamp();
  const range = applyResetToRange(currentStart, currentEnd, resetAt);
  const resetTime = resetAt ? new Date(resetAt).getTime() : null;

  try {
    if (period === 'today') {
      const startBkk = new Date(new Date(currentStart).getTime() + BANGKOK_OFFSET_MS);
      const points: TimelineDataPoint[] = [];

      for (let h = 0; h < 24; h++) {
        const slotStartBkk = new Date(
          Date.UTC(startBkk.getUTCFullYear(), startBkk.getUTCMonth(), startBkk.getUTCDate(), h, 0, 0)
        );
        const slotEndBkk = new Date(slotStartBkk.getTime() + 60 * 60 * 1000 - 1);
        const slotStartUtc = new Date(slotStartBkk.getTime() - BANGKOK_OFFSET_MS);
        const slotEndUtc = new Date(slotEndBkk.getTime() - BANGKOK_OFFSET_MS);

        const slotStartStr = slotStartUtc.toISOString();
        const slotEndStr = slotEndUtc.toISOString();

        let visitors = 0;
        let views = 0;

        if (range.isValid && (!resetTime || slotEndUtc.getTime() >= resetTime)) {
          const effectiveStart = resetTime && slotStartUtc.getTime() < resetTime ? resetAt! : slotStartStr;
          const res = await p.query(
            `SELECT 
               COUNT(DISTINCT visitor_id) as visitors,
               COUNT(DISTINCT session_id) as views
             FROM analytics_events
             WHERE created_at >= $1 AND created_at <= $2
               AND (actor_type IS NULL OR actor_type != 'admin')
               AND (user_id IS NULL OR user_id != 'admin')
               AND session_id NOT IN (
                 SELECT identifier_value FROM admin_identifiers 
                 WHERE identifier_type = 'session_id' AND identifier_value IS NOT NULL
               )`,
            [effectiveStart, slotEndStr]
          );
          visitors = parseInt(res.rows[0]?.visitors || '0', 10);
          views = parseInt(res.rows[0]?.views || '0', 10);
        }

        const hourStr = String(h).padStart(2, '0');
        const nextHourStr = String((h + 1) % 24).padStart(2, '0');

        points.push({
          date: slotStartStr,
          label: `${hourStr}:00`,
          visitors,
          views,
          fullDateLabel: `${startBkk.getUTCDate()} กันยายน 2569`,
          timeRangeLabel: `เวลา ${hourStr}:00–${hourStr}:59`,
        });
      }
      return points;
    }

    // Days timeline for 7d, 30d, 90d
    const numDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const now = new Date();
    const todayBkk = new Date(now.getTime() + BANGKOK_OFFSET_MS);
    const points: TimelineDataPoint[] = [];

    for (let i = numDays - 1; i >= 0; i--) {
      const dayBkk = new Date(todayBkk.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStartBkk = new Date(
        Date.UTC(dayBkk.getUTCFullYear(), dayBkk.getUTCMonth(), dayBkk.getUTCDate(), 0, 0, 0)
      );
      const dayEndBkk = new Date(dayStartBkk.getTime() + 24 * 60 * 60 * 1000 - 1);
      const dayStartUtc = new Date(dayStartBkk.getTime() - BANGKOK_OFFSET_MS);
      const dayEndUtc = new Date(dayEndBkk.getTime() - BANGKOK_OFFSET_MS);

      const dayStartStr = dayStartUtc.toISOString();
      const dayEndStr = dayEndUtc.toISOString();

      let visitors = 0;
      let views = 0;

      if (range.isValid && (!resetTime || dayEndUtc.getTime() >= resetTime)) {
        const effectiveStart = resetTime && dayStartUtc.getTime() < resetTime ? resetAt! : dayStartStr;
        const res = await p.query(
          `SELECT 
             COUNT(DISTINCT visitor_id) as visitors,
             COUNT(DISTINCT session_id) as views
           FROM analytics_events
           WHERE created_at >= $1 AND created_at <= $2
             AND (actor_type IS NULL OR actor_type != 'admin')
             AND (user_id IS NULL OR user_id != 'admin')
             AND session_id NOT IN (
               SELECT identifier_value FROM admin_identifiers 
               WHERE identifier_type = 'session_id' AND identifier_value IS NOT NULL
             )`,
          [effectiveStart, dayEndStr]
        );
        visitors = parseInt(res.rows[0]?.visitors || '0', 10);
        views = parseInt(res.rows[0]?.views || '0', 10);
      }

      points.push({
        date: dayStartStr,
        label: `${dayBkk.getUTCDate()} ก.ย.`,
        visitors,
        views,
        fullDateLabel: `${dayBkk.getUTCDate()} กันยายน 2569`,
        timeRangeLabel: 'ตลอดทั้งวัน (00:00–23:59)',
      });
    }

    return points;
  } catch (err) {
    console.error('[PostgreSQL] pgGetTimelineData error:', err);
    return [];
  }
}

/**
 * Get Top Dormitories from PostgreSQL
 */
export async function pgGetTopDormitories(period: PeriodType, limit = 5): Promise<TopDormitory[]> {
  await ensurePostgresInitialized();
  const p = getPgPool();
  if (!p) return [];

  const { currentStart, currentEnd } = getPeriodDateRanges(period);
  const resetAt = await pgGetDisplayResetTimestamp();
  const range = applyResetToRange(currentStart, currentEnd, resetAt);

  if (!range.isValid) return [];

  try {
    const res = await p.query(
      `SELECT 
         dormitory_id as id,
         dormitory_name as name,
         COUNT(*) as count
       FROM analytics_events
       WHERE dormitory_id IS NOT NULL 
         AND event_name = 'dormitory_view'
         AND created_at >= $1 AND created_at <= $2
         AND (actor_type IS NULL OR actor_type != 'admin')
         AND (user_id IS NULL OR user_id != 'admin')
         AND session_id NOT IN (
           SELECT identifier_value FROM admin_identifiers 
           WHERE identifier_type = 'session_id' AND identifier_value IS NOT NULL
         )
       GROUP BY dormitory_id, dormitory_name
       ORDER BY count DESC
       LIMIT $3`,
      [range.start, range.end, limit]
    );

    return res.rows.map((r) => ({
      id: Number(r.id),
      name: String(r.name || `หอพัก #${r.id}`),
      count: parseInt(r.count, 10),
    }));
  } catch (err) {
    console.error('[PostgreSQL] pgGetTopDormitories error:', err);
    return [];
  }
}

/**
 * Get Top Searches from PostgreSQL
 */
export async function pgGetTopSearchKeywords(period: PeriodType, limit = 5): Promise<TopSearch[]> {
  await ensurePostgresInitialized();
  const p = getPgPool();
  if (!p) return [];

  const { currentStart, currentEnd } = getPeriodDateRanges(period);
  const resetAt = await pgGetDisplayResetTimestamp();
  const range = applyResetToRange(currentStart, currentEnd, resetAt);

  if (!range.isValid) return [];

  try {
    const res = await p.query(
      `SELECT 
         LOWER(TRIM(search_keyword)) as keyword,
         COUNT(*) as count
       FROM analytics_events
       WHERE search_keyword IS NOT NULL 
         AND event_name = 'search'
         AND created_at >= $1 AND created_at <= $2
         AND (actor_type IS NULL OR actor_type != 'admin')
         AND (user_id IS NULL OR user_id != 'admin')
         AND session_id NOT IN (
           SELECT identifier_value FROM admin_identifiers 
           WHERE identifier_type = 'session_id' AND identifier_value IS NOT NULL
         )
       GROUP BY LOWER(TRIM(search_keyword))
       ORDER BY count DESC
       LIMIT $3`,
      [range.start, range.end, limit]
    );

    return res.rows.map((r) => ({
      keyword: String(r.keyword),
      count: parseInt(r.count, 10),
    }));
  } catch (err) {
    console.error('[PostgreSQL] pgGetTopSearchKeywords error:', err);
    return [];
  }
}

/**
 * Get Range Summary Counts for Historical Segments
 */
export async function pgGetRangeSummaryCounts(startAt: string | null, endAt: string) {
  await ensurePostgresInitialized();
  const p = getPgPool();
  if (!p) {
    return { uniqueVisitors: 0, pageViews: 0, dormitoryViews: 0, searchEvents: 0 };
  }

  try {
    const query = startAt
      ? `SELECT 
           COUNT(DISTINCT visitor_id) as unique_visitors,
           COUNT(DISTINCT session_id) as page_views,
           SUM(CASE WHEN event_name = 'dormitory_view' THEN 1 ELSE 0 END) as dorm_views,
           SUM(CASE WHEN event_name = 'search' THEN 1 ELSE 0 END) as search_events
         FROM analytics_events
         WHERE created_at >= $1 AND created_at < $2
           AND (actor_type IS NULL OR actor_type != 'admin')
           AND (user_id IS NULL OR user_id != 'admin')
           AND session_id NOT IN (
             SELECT identifier_value FROM admin_identifiers 
             WHERE identifier_type = 'session_id' AND identifier_value IS NOT NULL
           )`
      : `SELECT 
           COUNT(DISTINCT visitor_id) as unique_visitors,
           COUNT(DISTINCT session_id) as page_views,
           SUM(CASE WHEN event_name = 'dormitory_view' THEN 1 ELSE 0 END) as dorm_views,
           SUM(CASE WHEN event_name = 'search' THEN 1 ELSE 0 END) as search_events
         FROM analytics_events
         WHERE created_at < $1
           AND (actor_type IS NULL OR actor_type != 'admin')
           AND (user_id IS NULL OR user_id != 'admin')
           AND session_id NOT IN (
             SELECT identifier_value FROM admin_identifiers 
             WHERE identifier_type = 'session_id' AND identifier_value IS NOT NULL
           )`;

    const params = startAt ? [startAt, endAt] : [endAt];
    const res = await p.query(query, params);
    const row = res.rows[0];

    return {
      uniqueVisitors: parseInt(row?.unique_visitors || '0', 10),
      pageViews: parseInt(row?.page_views || '0', 10),
      dormitoryViews: parseInt(row?.dorm_views || '0', 10),
      searchEvents: parseInt(row?.search_events || '0', 10),
    };
  } catch (err) {
    console.error('[PostgreSQL] pgGetRangeSummaryCounts error:', err);
    return { uniqueVisitors: 0, pageViews: 0, dormitoryViews: 0, searchEvents: 0 };
  }
}

/**
 * Retrieve Historical Reset Periods from PostgreSQL
 */
export async function pgGetHistoricalPeriods(): Promise<HistoricalPeriod[]> {
  const history = await pgGetResetHistory();
  if (history.length === 0) return [];

  const sortedAsc = [...history].sort(
    (a, b) => new Date(a.resetAt).getTime() - new Date(b.resetAt).getTime()
  );

  const periods: HistoricalPeriod[] = [];

  for (let i = 0; i < sortedAsc.length; i++) {
    const currentReset = sortedAsc[i];
    const prevReset = i > 0 ? sortedAsc[i - 1] : null;

    const startAt = prevReset ? prevReset.resetAt : null;
    const endAt = currentReset.resetAt;
    const periodIndex = i + 1;

    const startFormatted = startAt
      ? new Date(new Date(startAt).getTime() + BANGKOK_OFFSET_MS).toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'เริ่มต้นระบบ';

    const endFormatted = new Date(new Date(endAt).getTime() + BANGKOK_OFFSET_MS).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const summary = await pgGetRangeSummaryCounts(startAt, endAt);

    periods.push({
      id: `epoch_${periodIndex}`,
      periodIndex,
      label: `รอบที่ ${periodIndex} (${startFormatted} - ${endFormatted})`,
      startAt,
      endAt,
      resetRecord: currentReset,
      summaryPreview: summary,
    });
  }

  return periods.reverse();
}

/**
 * Get Historical Analytics Data for a specific time window from PostgreSQL
 */
export async function pgGetHistoricalAnalyticsData(
  startAt: string | null,
  endAt: string,
  periodInfo?: { id: string; label: string }
): Promise<AnalyticsDashboardData> {
  await ensurePostgresInitialized();
  const p = getPgPool();
  const summary = await pgGetRangeSummaryCounts(startAt, endAt);

  if (!p) {
    return {
      period: 'historical' as const,
      summary: {
        uniqueVisitors: { value: summary.uniqueVisitors, prevValue: 0, changePercent: null },
        pageViews: { value: summary.pageViews, prevValue: 0, changePercent: null },
        searchEvents: { value: summary.searchEvents, prevValue: 0, changePercent: null },
        dormitoryViews: { value: summary.dormitoryViews, prevValue: 0, changePercent: null },
      },
      timeline: [],
      topDormitories: [],
      topSearches: [],
      historicalPeriod: periodInfo ? { ...periodInfo, startAt, endAt } : undefined,
    };
  }

  try {
    const dormQuery = startAt
      ? `SELECT dormitory_id as id, dormitory_name as name, COUNT(*) as count
         FROM analytics_events
         WHERE dormitory_id IS NOT NULL AND event_name = 'dormitory_view'
           AND created_at >= $1 AND created_at < $2
           AND (actor_type IS NULL OR actor_type != 'admin')
           AND (user_id IS NULL OR user_id != 'admin')
           AND session_id NOT IN (
             SELECT identifier_value FROM admin_identifiers 
             WHERE identifier_type = 'session_id' AND identifier_value IS NOT NULL
           )
         GROUP BY dormitory_id, dormitory_name
         ORDER BY count DESC LIMIT 5`
      : `SELECT dormitory_id as id, dormitory_name as name, COUNT(*) as count
         FROM analytics_events
         WHERE dormitory_id IS NOT NULL AND event_name = 'dormitory_view'
           AND created_at < $1
           AND (actor_type IS NULL OR actor_type != 'admin')
           AND (user_id IS NULL OR user_id != 'admin')
           AND session_id NOT IN (
             SELECT identifier_value FROM admin_identifiers 
             WHERE identifier_type = 'session_id' AND identifier_value IS NOT NULL
           )
         GROUP BY dormitory_id, dormitory_name
         ORDER BY count DESC LIMIT 5`;

    const dormRes = await p.query(dormQuery, startAt ? [startAt, endAt] : [endAt]);
    const topDormitories = dormRes.rows.map((r) => ({
      id: Number(r.id),
      name: String(r.name || `หอพัก #${r.id}`),
      count: parseInt(r.count, 10),
    }));

    const searchQuery = startAt
      ? `SELECT LOWER(TRIM(search_keyword)) as keyword, COUNT(*) as count
         FROM analytics_events
         WHERE search_keyword IS NOT NULL AND event_name = 'search'
           AND created_at >= $1 AND created_at < $2
           AND (actor_type IS NULL OR actor_type != 'admin')
           AND (user_id IS NULL OR user_id != 'admin')
           AND session_id NOT IN (
             SELECT identifier_value FROM admin_identifiers 
             WHERE identifier_type = 'session_id' AND identifier_value IS NOT NULL
           )
         GROUP BY LOWER(TRIM(search_keyword))
         ORDER BY count DESC LIMIT 5`
      : `SELECT LOWER(TRIM(search_keyword)) as keyword, COUNT(*) as count
         FROM analytics_events
         WHERE search_keyword IS NOT NULL AND event_name = 'search'
           AND created_at < $1
           AND (actor_type IS NULL OR actor_type != 'admin')
           AND (user_id IS NULL OR user_id != 'admin')
           AND session_id NOT IN (
             SELECT identifier_value FROM admin_identifiers 
             WHERE identifier_type = 'session_id' AND identifier_value IS NOT NULL
           )
         GROUP BY LOWER(TRIM(search_keyword))
         ORDER BY count DESC LIMIT 5`;

    const searchRes = await p.query(searchQuery, startAt ? [startAt, endAt] : [endAt]);
    const topSearches = searchRes.rows.map((r) => ({
      keyword: String(r.keyword),
      count: parseInt(r.count, 10),
    }));

    return {
      period: 'historical' as const,
      summary: {
        uniqueVisitors: { value: summary.uniqueVisitors, prevValue: 0, changePercent: null },
        pageViews: { value: summary.pageViews, prevValue: 0, changePercent: null },
        searchEvents: { value: summary.searchEvents, prevValue: 0, changePercent: null },
        dormitoryViews: { value: summary.dormitoryViews, prevValue: 0, changePercent: null },
      },
      timeline: [],
      topDormitories,
      topSearches,
      historicalPeriod: periodInfo ? { ...periodInfo, startAt, endAt } : undefined,
    };
  } catch (err) {
    console.error('[PostgreSQL] pgGetHistoricalAnalyticsData error:', err);
    return {
      period: 'historical' as const,
      summary: {
        uniqueVisitors: { value: summary.uniqueVisitors, prevValue: 0, changePercent: null },
        pageViews: { value: summary.pageViews, prevValue: 0, changePercent: null },
        searchEvents: { value: summary.searchEvents, prevValue: 0, changePercent: null },
        dormitoryViews: { value: summary.dormitoryViews, prevValue: 0, changePercent: null },
      },
      timeline: [],
      topDormitories: [],
      topSearches: [],
      historicalPeriod: periodInfo ? { ...periodInfo, startAt, endAt } : undefined,
    };
  }
}
