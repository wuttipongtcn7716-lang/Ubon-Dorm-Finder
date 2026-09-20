import fs from 'fs';
import path from 'path';

export type AnalyticsEventType = 
  | 'page_view' 
  | 'search' 
  | 'dormitory_view' 
  | 'map_click' 
  | 'navigation_click';

export interface AnalyticsEventInput {
  eventName: AnalyticsEventType;
  sessionId: string;
  visitorId: string;
  userId?: string | null;
  page?: string | null;
  dormitoryId?: number | null;
  dormitoryName?: string | null;
  searchKeyword?: string | null;
  metadata?: Record<string, any> | null;
  createdAt?: string;
}

export interface StoredAnalyticsEvent {
  id: number;
  eventName: AnalyticsEventType;
  sessionId: string;
  visitorId: string;
  userId: string | null;
  page: string | null;
  dormitoryId: number | null;
  dormitoryName: string | null;
  searchKeyword: string | null;
  metadata: string | null;
  createdAt: string; // ISO string
}

export type PeriodType = 'today' | '7d' | '30d' | '90d';

export interface SummaryMetric {
  value: number;
  prevValue: number;
  changePercent: number | null;
}

export interface AnalyticsSummary {
  uniqueVisitors: SummaryMetric;
  pageViews: SummaryMetric;
  searchEvents: SummaryMetric;
  dormitoryViews: SummaryMetric;
}

export interface TimelineDataPoint {
  date: string;
  label: string;
  visitors: number;
  views: number;
}

export interface TopDormitory {
  id: number;
  name: string;
  count: number;
}

export interface TopSearch {
  keyword: string;
  count: number;
}

export interface AnalyticsResetRecord {
  id: number;
  resetAt: string;     // ISO timestamp
  createdBy: string;   // e.g. 'admin'
  createdAt: string;   // ISO timestamp
  note?: string | null;
}

export interface HistoricalPeriod {
  id: string;          // e.g. "epoch_1", "epoch_2"
  periodIndex: number; // 1, 2, 3...
  label: string;       // e.g. "รอบที่ 1 (15 ก.ย. 2026 - 20 ก.ย. 2026)"
  startAt: string | null; // ISO timestamp or null if beginning of time
  endAt: string;       // ISO timestamp
  resetRecord?: AnalyticsResetRecord;
  summaryPreview: {
    uniqueVisitors: number;
    pageViews: number;
    dormitoryViews: number;
    searchEvents: number;
  };
}

export interface AnalyticsDashboardData {
  period: PeriodType | 'historical';
  summary: AnalyticsSummary;
  timeline: TimelineDataPoint[];
  topDormitories: TopDormitory[];
  topSearches: TopSearch[];
  displayResetAt?: string | null;
  historicalPeriod?: {
    id: string;
    label: string;
    startAt: string | null;
    endAt: string;
  };
}

export interface PublicStatisticsData {
  uniqueVisitors: number;
  pageViews: number;
  dormitoryViews: number;
  searchEvents: number;
  period: PeriodType;
  periodLabel: string;
  updatedAt: string;
}

/**
 * Storage Resolution: Strictly isolates Development/Test and Production databases.
 * - Test/Development: uses analytics.dev.db or analytics.test.db in ./data/
 * - Production: uses analytics.prod.db (or /tmp/analytics.prod.db on Vercel serverless)
 * - Or explicit ANALYTICS_DB_PATH environment variable
 */
export function resolveAnalyticsStorageConfig() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (process.env.ANALYTICS_DB_PATH) {
    const explicit = process.env.ANALYTICS_DB_PATH;
    const dbPath = path.isAbsolute(explicit) ? explicit : path.join(process.cwd(), explicit);
    const jsonPath = dbPath.replace(/\.db$/, '.json');
    const settingsJsonPath = dbPath.replace(/\.db$/, '_settings.json');
    const historyJsonPath = dbPath.replace(/\.db$/, '_history.json');
    return { environment: nodeEnv, dbPath, jsonPath, settingsJsonPath, historyJsonPath, isProduction: isProd };
  }

  let dataDir: string;
  let dbFileName: string;
  let jsonFileName: string;
  let settingsFileName: string;
  let historyFileName: string;

  if (isProd) {
    dataDir = isServerless ? '/tmp' : path.join(process.cwd(), 'data');
    dbFileName = 'analytics.prod.db';
    jsonFileName = 'analytics_events.prod.json';
    settingsFileName = 'analytics_settings.prod.json';
    historyFileName = 'analytics_reset_history.prod.json';
  } else if (isTest) {
    dataDir = path.join(process.cwd(), 'data');
    dbFileName = 'analytics.test.db';
    jsonFileName = 'analytics_events.test.json';
    settingsFileName = 'analytics_settings.test.json';
    historyFileName = 'analytics_reset_history.test.json';
  } else {
    dataDir = path.join(process.cwd(), 'data');
    dbFileName = 'analytics.dev.db';
    jsonFileName = 'analytics_events.dev.json';
    settingsFileName = 'analytics_settings.dev.json';
    historyFileName = 'analytics_reset_history.dev.json';
  }

  return {
    environment: nodeEnv,
    dbPath: path.join(dataDir, dbFileName),
    jsonPath: path.join(dataDir, jsonFileName),
    settingsJsonPath: path.join(dataDir, settingsFileName),
    historyJsonPath: path.join(dataDir, historyFileName),
    isProduction: isProd,
  };
}

const activeConfig = resolveAnalyticsStorageConfig();
const activeDbDir = path.dirname(activeConfig.dbPath);

// Ensure storage directory exists
if (!fs.existsSync(activeDbDir)) {
  try {
    fs.mkdirSync(activeDbDir, { recursive: true });
  } catch (err) {
    console.warn('Failed to create storage directory:', err);
  }
}

// In-memory / file-persisted engine with SQLite acceleration when available
let sqliteDb: any = null;
let useSqlite = false;

try {
  // Dynamically load node:sqlite if available in runtime
  const { DatabaseSync } = require('node:sqlite');
  sqliteDb = new DatabaseSync(activeConfig.dbPath);
  
  // Create schema & indexes
  sqliteDb.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_name TEXT NOT NULL,
      session_id TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      user_id TEXT,
      page TEXT,
      dormitory_id INTEGER,
      dormitory_name TEXT,
      search_keyword TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS analytics_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS analytics_reset_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reset_at TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      note TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_event_name ON analytics_events(event_name);
    CREATE INDEX IF NOT EXISTS idx_created_at ON analytics_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_visitor_id ON analytics_events(visitor_id);
    CREATE INDEX IF NOT EXISTS idx_dormitory_id ON analytics_events(dormitory_id);
    CREATE INDEX IF NOT EXISTS idx_reset_at ON analytics_reset_history(reset_at);
  `);

  // Migrate existing reset setting into reset history if history is currently empty
  try {
    const histRow = sqliteDb.prepare('SELECT COUNT(*) as cnt FROM analytics_reset_history').get();
    if (Number(histRow?.cnt || 0) === 0) {
      const setRow = sqliteDb.prepare('SELECT value, updated_at FROM analytics_settings WHERE key = ?').get('analytics_display_reset_at');
      if (setRow && setRow.value) {
        sqliteDb.prepare('INSERT INTO analytics_reset_history (reset_at, created_by, created_at, note) VALUES (?, ?, ?, ?)').run(
          String(setRow.value),
          'admin',
          String(setRow.updated_at || setRow.value),
          'รีเซ็ตเริ่มต้น'
        );
      }
    }
  } catch (e) {}

  useSqlite = true;
} catch (err) {
  useSqlite = false;
  if (!fs.existsSync(activeConfig.jsonPath)) {
    try {
      fs.writeFileSync(activeConfig.jsonPath, JSON.stringify([], null, 2), 'utf-8');
    } catch (e) {
      console.warn('Failed to initialize fallback JSON storage:', e);
    }
  }
}

// Helper: read JSON fallback
function readJsonEvents(): StoredAnalyticsEvent[] {
  try {
    if (!fs.existsSync(activeConfig.jsonPath)) return [];
    const raw = fs.readFileSync(activeConfig.jsonPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

// Helper: write JSON fallback
function writeJsonEvents(events: StoredAnalyticsEvent[]) {
  try {
    fs.writeFileSync(activeConfig.jsonPath, JSON.stringify(events, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write JSON events:', err);
  }
}

// Helper: read JSON settings fallback
function readJsonSettings(): Record<string, string> {
  try {
    if (!fs.existsSync(activeConfig.settingsJsonPath)) return {};
    const raw = fs.readFileSync(activeConfig.settingsJsonPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

// Helper: write JSON settings fallback
function writeJsonSettings(settings: Record<string, string>) {
  try {
    fs.writeFileSync(activeConfig.settingsJsonPath, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write JSON settings:', err);
  }
}

// Helper: read JSON reset history fallback
function readJsonResetHistory(): AnalyticsResetRecord[] {
  try {
    if (!fs.existsSync(activeConfig.historyJsonPath)) return [];
    const raw = fs.readFileSync(activeConfig.historyJsonPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

// Helper: write JSON reset history fallback
function writeJsonResetHistory(history: AnalyticsResetRecord[]) {
  try {
    fs.writeFileSync(activeConfig.historyJsonPath, JSON.stringify(history, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write JSON reset history:', err);
  }
}

export function getAnalyticsSetting(key: string): string | null {
  if (useSqlite && sqliteDb) {
    try {
      const row = sqliteDb.prepare('SELECT value FROM analytics_settings WHERE key = ?').get(key);
      if (row && typeof row.value === 'string') {
        return row.value;
      }
      return null;
    } catch (e) {
      console.warn('SQLite getAnalyticsSetting error, fallback to JSON:', e);
    }
  }

  const settings = readJsonSettings();
  return settings[key] || null;
}

export function setAnalyticsSetting(key: string, value: string): void {
  const now = new Date().toISOString();
  if (useSqlite && sqliteDb) {
    try {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO analytics_settings (key, value, updated_at)
        VALUES (?, ?, ?)
      `).run(key, value, now);
      return;
    } catch (e) {
      console.warn('SQLite setAnalyticsSetting error, fallback to JSON:', e);
    }
  }

  const settings = readJsonSettings();
  settings[key] = value;
  writeJsonSettings(settings);
}

/**
 * Get full history of all Reset Points
 */
export function getResetHistory(): AnalyticsResetRecord[] {
  if (useSqlite && sqliteDb) {
    try {
      const rows = sqliteDb.prepare(`
        SELECT id, reset_at as resetAt, created_by as createdBy, created_at as createdAt, note
        FROM analytics_reset_history
        ORDER BY datetime(reset_at) DESC
      `).all();
      return rows.map((r: any) => ({
        id: Number(r.id),
        resetAt: String(r.resetAt),
        createdBy: String(r.createdBy || 'admin'),
        createdAt: String(r.createdAt || r.resetAt),
        note: r.note ? String(r.note) : null,
      }));
    } catch (e) {
      console.warn('SQLite getResetHistory error, fallback to JSON:', e);
    }
  }

  const list = readJsonResetHistory();
  return [...list].sort((a, b) => new Date(b.resetAt).getTime() - new Date(a.resetAt).getTime());
}

/**
 * Create a new Reset Point with zero data loss
 * - Inserts a new record into analytics_reset_history
 * - Updates the latest reset timestamp
 * - All historical events in analytics_events remain 100% intact
 */
export function createResetRecord(createdBy = 'admin', note?: string): AnalyticsResetRecord {
  const now = new Date().toISOString();
  let newRecord: AnalyticsResetRecord;

  if (useSqlite && sqliteDb) {
    try {
      const stmt = sqliteDb.prepare(`
        INSERT INTO analytics_reset_history (reset_at, created_by, created_at, note)
        VALUES (?, ?, ?, ?)
      `);
      const res = stmt.run(now, createdBy, now, note || null);
      newRecord = {
        id: Number(res.lastInsertRowid),
        resetAt: now,
        createdBy,
        createdAt: now,
        note: note || null,
      };
    } catch (e) {
      console.warn('SQLite createResetRecord error, fallback to JSON:', e);
      const list = readJsonResetHistory();
      const newId = list.length > 0 ? list[list.length - 1].id + 1 : 1;
      newRecord = {
        id: newId,
        resetAt: now,
        createdBy,
        createdAt: now,
        note: note || null,
      };
      list.push(newRecord);
      writeJsonResetHistory(list);
    }
  } else {
    const list = readJsonResetHistory();
    const newId = list.length > 0 ? list[list.length - 1].id + 1 : 1;
    newRecord = {
      id: newId,
      resetAt: now,
      createdBy,
      createdAt: now,
      note: note || null,
    };
    list.push(newRecord);
    writeJsonResetHistory(list);
  }

  // Update latest setting
  setAnalyticsSetting('analytics_display_reset_at', now);

  return newRecord;
}

export function getDisplayResetTimestamp(): string | null {
  if (useSqlite && sqliteDb) {
    try {
      const row = sqliteDb.prepare('SELECT reset_at FROM analytics_reset_history ORDER BY datetime(reset_at) DESC LIMIT 1').get();
      if (row && row.reset_at) {
        return String(row.reset_at);
      }
    } catch (e) {}
  }

  const list = readJsonResetHistory();
  if (list.length > 0) {
    const sorted = [...list].sort((a, b) => new Date(b.resetAt).getTime() - new Date(a.resetAt).getTime());
    return sorted[0].resetAt;
  }

  return getAnalyticsSetting('analytics_display_reset_at');
}

export function setDisplayResetTimestamp(timestamp?: string): string {
  const rec = createResetRecord('admin', 'รีเซ็ตการแสดงผล');
  return rec.resetAt;
}

/**
 * Applies display reset filtering to any [start, end] date range.
 * If resetAt is set:
 * - Any interval entirely before resetAt has isValid: false (returns 0 / empty).
 * - Any interval overlapping or after resetAt is clamped so start = Math.max(start, resetAt).
 */
export function applyResetToRange(
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


/**
 * Record a new analytics event into the database
 */
export function recordEvent(event: AnalyticsEventInput): StoredAnalyticsEvent {
  const createdAt = event.createdAt || new Date().toISOString();
  const metadataStr = event.metadata ? JSON.stringify(event.metadata) : null;

  if (useSqlite && sqliteDb) {
    try {
      const stmt = sqliteDb.prepare(`
        INSERT INTO analytics_events 
        (event_name, session_id, visitor_id, user_id, page, dormitory_id, dormitory_name, search_keyword, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const res = stmt.run(
        event.eventName,
        event.sessionId,
        event.visitorId,
        event.userId || null,
        event.page || null,
        event.dormitoryId || null,
        event.dormitoryName || null,
        event.searchKeyword || null,
        metadataStr,
        createdAt
      );
      return {
        id: Number(res.lastInsertRowid),
        eventName: event.eventName,
        sessionId: event.sessionId,
        visitorId: event.visitorId,
        userId: event.userId || null,
        page: event.page || null,
        dormitoryId: event.dormitoryId || null,
        dormitoryName: event.dormitoryName || null,
        searchKeyword: event.searchKeyword || null,
        metadata: metadataStr,
        createdAt,
      };
    } catch (e) {
      console.warn('SQLite insert error, falling back to JSON:', e);
    }
  }

  // Fallback to JSON file
  const events = readJsonEvents();
  const newId = events.length > 0 ? events[events.length - 1].id + 1 : 1;
  const newEvent: StoredAnalyticsEvent = {
    id: newId,
    eventName: event.eventName,
    sessionId: event.sessionId,
    visitorId: event.visitorId,
    userId: event.userId || null,
    page: event.page || null,
    dormitoryId: event.dormitoryId || null,
    dormitoryName: event.dormitoryName || null,
    searchKeyword: event.searchKeyword || null,
    metadata: metadataStr,
    createdAt,
  };
  events.push(newEvent);
  writeJsonEvents(events);
  return newEvent;
}

/**
 * Calculate date range for the given period (using UTC ISO strings)
 */
function getPeriodDateRanges(period: PeriodType) {
  const now = new Date();
  let currentStart: Date;
  let prevStart: Date;
  let prevEnd: Date;

  if (period === 'today') {
    currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
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
  } else { // '90d'
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

function calculatePercentChange(current: number, prev: number): number | null {
  if (prev === 0) {
    if (current === 0) return null;
    return 100;
  }
  const change = ((current - prev) / prev) * 100;
  return Math.round(change * 10) / 10;
}

/**
 * Get Summary of 4 Key Metrics with comparison
 * Uses datetime(...) in SQL for resilient date comparisons
 */
export function getAnalyticsSummary(period: PeriodType): AnalyticsSummary {
  const { currentStart, currentEnd, prevStart, prevEnd } = getPeriodDateRanges(period);
  const resetAt = getDisplayResetTimestamp();

  const currRange = applyResetToRange(currentStart, currentEnd, resetAt);
  const prevRange = applyResetToRange(prevStart, prevEnd, resetAt);

  if (useSqlite && sqliteDb) {
    try {
      const getCounts = (range: { start: string; end: string; isValid: boolean }) => {
        if (!range.isValid) {
          return {
            uniqueVisitors: 0,
            pageViews: 0,
            searchEvents: 0,
            dormitoryViews: 0,
          };
        }
        const row = sqliteDb.prepare(`
          SELECT 
            COUNT(DISTINCT visitor_id) as unique_visitors,
            SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) as page_views,
            SUM(CASE WHEN event_name = 'search' THEN 1 ELSE 0 END) as search_events,
            SUM(CASE WHEN event_name = 'dormitory_view' THEN 1 ELSE 0 END) as dorm_views
          FROM analytics_events
          WHERE created_at >= ? AND created_at <= ?
        `).get(range.start, range.end);
        return {
          uniqueVisitors: Number(row?.unique_visitors || 0),
          pageViews: Number(row?.page_views || 0),
          searchEvents: Number(row?.search_events || 0),
          dormitoryViews: Number(row?.dorm_views || 0),
        };
      };

      const curr = getCounts(currRange);
      const prev = getCounts(prevRange);

      return {
        uniqueVisitors: {
          value: curr.uniqueVisitors,
          prevValue: prev.uniqueVisitors,
          changePercent: calculatePercentChange(curr.uniqueVisitors, prev.uniqueVisitors),
        },
        pageViews: {
          value: curr.pageViews,
          prevValue: prev.pageViews,
          changePercent: calculatePercentChange(curr.pageViews, prev.pageViews),
        },
        searchEvents: {
          value: curr.searchEvents,
          prevValue: prev.searchEvents,
          changePercent: calculatePercentChange(curr.searchEvents, prev.searchEvents),
        },
        dormitoryViews: {
          value: curr.dormitoryViews,
          prevValue: prev.dormitoryViews,
          changePercent: calculatePercentChange(curr.dormitoryViews, prev.dormitoryViews),
        },
      };
    } catch (e) {
      console.warn('SQLite summary query failed, fallback to JSON:', e);
    }
  }

  // Fallback implementation with JSON
  const events = readJsonEvents();
  const inRange = (d: string, start: string, end: string) => {
    const t = new Date(d).getTime();
    return t >= new Date(start).getTime() && t <= new Date(end).getTime();
  };

  const getCounts = (range: { start: string; end: string; isValid: boolean }) => {
    if (!range.isValid) {
      return {
        uniqueVisitors: 0,
        pageViews: 0,
        searchEvents: 0,
        dormitoryViews: 0,
      };
    }
    const subset = events.filter(e => inRange(e.createdAt, range.start, range.end));
    const visitors = new Set(subset.map(e => e.visitorId));
    const pageViews = subset.filter(e => e.eventName === 'page_view').length;
    const searchEvents = subset.filter(e => e.eventName === 'search').length;
    const dormViews = subset.filter(e => e.eventName === 'dormitory_view').length;
    return {
      uniqueVisitors: visitors.size,
      pageViews,
      searchEvents,
      dormitoryViews: dormViews,
    };
  };

  const curr = getCounts(currRange);
  const prev = getCounts(prevRange);

  return {
    uniqueVisitors: {
      value: curr.uniqueVisitors,
      prevValue: prev.uniqueVisitors,
      changePercent: calculatePercentChange(curr.uniqueVisitors, prev.uniqueVisitors),
    },
    pageViews: {
      value: curr.pageViews,
      prevValue: prev.pageViews,
      changePercent: calculatePercentChange(curr.pageViews, prev.pageViews),
    },
    searchEvents: {
      value: curr.searchEvents,
      prevValue: prev.searchEvents,
      changePercent: calculatePercentChange(curr.searchEvents, prev.searchEvents),
    },
    dormitoryViews: {
      value: curr.dormitoryViews,
      prevValue: prev.dormitoryViews,
      changePercent: calculatePercentChange(curr.dormitoryViews, prev.dormitoryViews),
    },
  };
}

/**
 * Format date for display in Thai locale (e.g., '14 ก.ย.')
 */
const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

function formatThaiDateLabel(d: Date): string {
  const day = d.getDate();
  const month = THAI_MONTHS_SHORT[d.getMonth()];
  return `${day} ${month}`;
}

/**
 * Get timeline data for Main Chart
 */
export function getTimelineData(period: PeriodType): TimelineDataPoint[] {
  const now = new Date();
  const points: TimelineDataPoint[] = [];
  const resetAt = getDisplayResetTimestamp();

  if (period === 'today') {
    // Generate 12 slots (every 2 hours) from 00:00 to 24:00
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const slots = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

    for (const hour of slots) {
      const slotStart = new Date(startOfDay.getTime() + hour * 3600 * 1000);
      const slotEnd = new Date(startOfDay.getTime() + (hour + 2) * 3600 * 1000 - 1);
      const label = `${String(hour).padStart(2, '0')}:00`;
      const dateKey = slotStart.toISOString();

      const range = applyResetToRange(slotStart.toISOString(), slotEnd.toISOString(), resetAt);

      let visitors = 0;
      let views = 0;

      if (range.isValid) {
        if (useSqlite && sqliteDb) {
          try {
            const row = sqliteDb.prepare(`
              SELECT 
                COUNT(DISTINCT visitor_id) as visitors,
                COUNT(*) as views
              FROM analytics_events
              WHERE created_at >= ? AND created_at <= ?
            `).get(range.start, range.end);
            visitors = Number(row?.visitors || 0);
            views = Number(row?.views || 0);
          } catch (e) {
            // ignore
          }
        } else {
          const events = readJsonEvents();
          const inSlot = events.filter(e => {
            const t = new Date(e.createdAt).getTime();
            return t >= new Date(range.start).getTime() && t <= new Date(range.end).getTime();
          });
          visitors = new Set(inSlot.map(e => e.visitorId)).size;
          views = inSlot.length;
        }
      }

      points.push({
        date: dateKey,
        label,
        visitors,
        views,
      });
    }
    return points;
  }

  // For 7d, 30d, 90d: Generate daily data points
  const daysCount = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (daysCount - 1), 0, 0, 0);

  for (let i = 0; i < daysCount; i++) {
    const cur = new Date(startDay.getTime() + i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 0, 0, 0).toISOString();
    const dayEnd = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 23, 59, 59, 999).toISOString();
    const label = formatThaiDateLabel(cur);

    const range = applyResetToRange(dayStart, dayEnd, resetAt);

    let visitors = 0;
    let views = 0;

    if (range.isValid) {
      if (useSqlite && sqliteDb) {
        try {
          const row = sqliteDb.prepare(`
            SELECT 
              COUNT(DISTINCT visitor_id) as visitors,
              COUNT(*) as views
            FROM analytics_events
            WHERE created_at >= ? AND created_at <= ?
          `).get(range.start, range.end);
          visitors = Number(row?.visitors || 0);
          views = Number(row?.views || 0);
        } catch (e) {
          // ignore
        }
      } else {
        const events = readJsonEvents();
        const inDay = events.filter(e => {
          const t = new Date(e.createdAt).getTime();
          return t >= new Date(range.start).getTime() && t <= new Date(range.end).getTime();
        });
        visitors = new Set(inDay.map(e => e.visitorId)).size;
        views = inDay.length;
      }
    }

    points.push({
      date: dayStart.slice(0, 10),
      label,
      visitors,
      views,
    });
  }

  return points;
}

/**
 * Get Top 5 Most Popular Dormitories by view count
 */
export function getTopDormitories(period: PeriodType, limit = 5): TopDormitory[] {
  const { currentStart, currentEnd } = getPeriodDateRanges(period);
  const resetAt = getDisplayResetTimestamp();
  const range = applyResetToRange(currentStart, currentEnd, resetAt);

  if (!range.isValid) {
    return [];
  }

  if (useSqlite && sqliteDb) {
    try {
      const rows = sqliteDb.prepare(`
        SELECT 
          dormitory_id as id,
          dormitory_name as name,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'dormitory_view'
          AND dormitory_id IS NOT NULL
          AND created_at >= ? AND created_at <= ?
        GROUP BY dormitory_id, dormitory_name
        ORDER BY count DESC
        LIMIT ?
      `).all(range.start, range.end, limit);

      return rows.map((r: any) => ({
        id: Number(r.id),
        name: r.name || `หอพัก #${r.id}`,
        count: Number(r.count),
      }));
    } catch (e) {
      console.warn('SQLite top dorms error, fallback to JSON:', e);
    }
  }

  const events = readJsonEvents();
  const subset = events.filter(e => {
    const t = new Date(e.createdAt).getTime();
    return (
      e.eventName === 'dormitory_view' && 
      e.dormitoryId != null &&
      t >= new Date(range.start).getTime() && 
      t <= new Date(range.end).getTime()
    );
  });

  const map = new Map<number, { name: string; count: number }>();
  for (const ev of subset) {
    const id = ev.dormitoryId!;
    const name = ev.dormitoryName || `หอพัก #${id}`;
    if (!map.has(id)) {
      map.set(id, { name, count: 0 });
    }
    map.get(id)!.count++;
  }

  return Array.from(map.entries())
    .map(([id, val]) => ({ id, name: val.name, count: val.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get Top 5 Search Keywords by frequency
 */
export function getTopSearchKeywords(period: PeriodType, limit = 5): TopSearch[] {
  const { currentStart, currentEnd } = getPeriodDateRanges(period);
  const resetAt = getDisplayResetTimestamp();
  const range = applyResetToRange(currentStart, currentEnd, resetAt);

  if (!range.isValid) {
    return [];
  }

  if (useSqlite && sqliteDb) {
    try {
      const rows = sqliteDb.prepare(`
        SELECT 
          LOWER(TRIM(search_keyword)) as keyword,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'search'
          AND search_keyword IS NOT NULL
          AND TRIM(search_keyword) != ''
          AND created_at >= ? AND created_at <= ?
        GROUP BY LOWER(TRIM(search_keyword))
        ORDER BY count DESC
        LIMIT ?
      `).all(range.start, range.end, limit);

      return rows.map((r: any) => ({
        keyword: String(r.keyword),
        count: Number(r.count),
      }));
    } catch (e) {
      console.warn('SQLite top searches error, fallback to JSON:', e);
    }
  }

  const events = readJsonEvents();
  const subset = events.filter(e => {
    const t = new Date(e.createdAt).getTime();
    return (
      e.eventName === 'search' && 
      e.searchKeyword && 
      e.searchKeyword.trim() !== '' &&
      t >= new Date(range.start).getTime() && 
      t <= new Date(range.end).getTime()
    );
  });

  const map = new Map<string, number>();
  for (const ev of subset) {
    const kw = ev.searchKeyword!.trim().toLowerCase();
    map.set(kw, (map.get(kw) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Query complete Analytics Dashboard Data for given period
 * NO Mockup Data: queries strictly from real events in database.
 */
export function getAnalyticsDashboardData(period: PeriodType): AnalyticsDashboardData {
  return {
    period,
    summary: getAnalyticsSummary(period),
    timeline: getTimelineData(period),
    topDormitories: getTopDormitories(period, 5),
    topSearches: getTopSearchKeywords(period, 5),
    displayResetAt: getDisplayResetTimestamp(),
  };
}

function formatThaiDateTimeString(iso: string): string {
  try {
    const d = new Date(iso);
    const day = d.getDate();
    const month = THAI_MONTHS_SHORT[d.getMonth()];
    const year = d.getFullYear() + 543;
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} ${hour}:${min} น.`;
  } catch (e) {
    return iso;
  }
}

/**
 * Helper to compute summary counts for any arbitrary [startAt, endAt) time range
 */
export function getRangeSummaryCounts(startAt: string | null, endAt: string) {
  if (useSqlite && sqliteDb) {
    try {
      const sql = startAt
        ? `SELECT 
            COUNT(DISTINCT visitor_id) as unique_visitors,
            SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) as page_views,
            SUM(CASE WHEN event_name = 'search' THEN 1 ELSE 0 END) as search_events,
            SUM(CASE WHEN event_name = 'dormitory_view' THEN 1 ELSE 0 END) as dorm_views
          FROM analytics_events
          WHERE created_at >= ? AND created_at < ?`
        : `SELECT 
            COUNT(DISTINCT visitor_id) as unique_visitors,
            SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) as page_views,
            SUM(CASE WHEN event_name = 'search' THEN 1 ELSE 0 END) as search_events,
            SUM(CASE WHEN event_name = 'dormitory_view' THEN 1 ELSE 0 END) as dorm_views
          FROM analytics_events
          WHERE created_at < ?`;

      const params = startAt ? [startAt, endAt] : [endAt];
      const row = sqliteDb.prepare(sql).get(...params);
      return {
        uniqueVisitors: Number(row?.unique_visitors || 0),
        pageViews: Number(row?.page_views || 0),
        searchEvents: Number(row?.search_events || 0),
        dormitoryViews: Number(row?.dorm_views || 0),
      };
    } catch (e) {
      console.warn('SQLite range summary error, fallback to JSON:', e);
    }
  }

  const events = readJsonEvents();
  const subset = events.filter((e) => {
    const t = new Date(e.createdAt).getTime();
    const endT = new Date(endAt).getTime();
    if (t >= endT) return false;
    if (startAt && t < new Date(startAt).getTime()) return false;
    return true;
  });

  const visitors = new Set(subset.map((e) => e.visitorId));
  const pageViews = subset.filter((e) => e.eventName === 'page_view').length;
  const searchEvents = subset.filter((e) => e.eventName === 'search').length;
  const dormViews = subset.filter((e) => e.eventName === 'dormitory_view').length;
  return {
    uniqueVisitors: visitors.size,
    pageViews,
    searchEvents,
    dormitoryViews: dormViews,
  };
}

/**
 * Get all historical segments created by previous resets
 */
export function getHistoricalPeriods(): HistoricalPeriod[] {
  const history = getResetHistory(); // already sorted DESC
  if (history.length === 0) {
    return [];
  }

  // Sort chronologically ascending to compute intervals
  const chronological = [...history].sort(
    (a, b) => new Date(a.resetAt).getTime() - new Date(b.resetAt).getTime()
  );

  const periods: HistoricalPeriod[] = [];

  for (let i = 0; i < chronological.length; i++) {
    const currentReset = chronological[i];
    const prevReset = i > 0 ? chronological[i - 1] : null;

    const startAt = prevReset ? prevReset.resetAt : null;
    const endAt = currentReset.resetAt;
    const periodIndex = i + 1;

    let label = '';
    if (!startAt) {
      label = `ข้อมูลก่อนรีเซ็ตครั้งที่ 1 (ถึง ${formatThaiDateTimeString(endAt)})`;
    } else {
      label = `ข้อมูลรอบที่ ${i} (${formatThaiDateTimeString(startAt)} — ${formatThaiDateTimeString(endAt)})`;
    }

    const summaryPreview = getRangeSummaryCounts(startAt, endAt);

    periods.push({
      id: `period_${currentReset.id}`,
      periodIndex,
      label,
      startAt,
      endAt,
      resetRecord: currentReset,
      summaryPreview,
    });
  }

  // Return with latest period first (most recent historical first)
  return periods.reverse();
}

/**
 * Get full analytics dashboard data for a specific historical time window [startAt, endAt)
 * Strictly queries real events from database without mock data.
 */
export function getHistoricalAnalyticsData(
  startAt: string | null,
  endAt: string,
  periodInfo?: { id?: string; label?: string }
): AnalyticsDashboardData {
  const counts = getRangeSummaryCounts(startAt, endAt);

  const summary: AnalyticsSummary = {
    uniqueVisitors: {
      value: counts.uniqueVisitors,
      prevValue: 0,
      changePercent: null,
    },
    pageViews: {
      value: counts.pageViews,
      prevValue: 0,
      changePercent: null,
    },
    searchEvents: {
      value: counts.searchEvents,
      prevValue: 0,
      changePercent: null,
    },
    dormitoryViews: {
      value: counts.dormitoryViews,
      prevValue: 0,
      changePercent: null,
    },
  };

  // Build Timeline Data Points for the historical range
  const endDate = new Date(endAt);
  let startDate: Date;

  if (startAt) {
    startDate = new Date(startAt);
  } else {
    // Find earliest event
    let earliestTime: number | null = null;
    if (useSqlite && sqliteDb) {
      try {
        const row = sqliteDb.prepare('SELECT MIN(created_at) as min_date FROM analytics_events WHERE created_at < ?').get(endAt);
        if (row && row.min_date) {
          earliestTime = new Date(row.min_date).getTime();
        }
      } catch (e) {}
    }
    if (!earliestTime) {
      const events = readJsonEvents().filter((e) => new Date(e.createdAt).getTime() < endDate.getTime());
      if (events.length > 0) {
        earliestTime = new Date(events[0].createdAt).getTime();
      }
    }
    startDate = earliestTime ? new Date(earliestTime) : new Date(endDate.getTime() - 7 * 24 * 3600 * 1000);
  }

  const timeline: TimelineDataPoint[] = [];
  const spanDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 3600 * 1000)));

  if (spanDays <= 2) {
    // 2-hour slots
    const startOfSlot = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0);
    const slots = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

    for (const hour of slots) {
      const slotStart = new Date(startOfSlot.getTime() + hour * 3600 * 1000);
      const slotEnd = new Date(startOfSlot.getTime() + (hour + 2) * 3600 * 1000 - 1);
      if (slotStart.getTime() >= endDate.getTime()) break;

      const label = `${String(hour).padStart(2, '0')}:00`;
      const dateKey = slotStart.toISOString();

      let visitors = 0;
      let views = 0;

      if (useSqlite && sqliteDb) {
        try {
          const row = sqliteDb.prepare(`
            SELECT 
              COUNT(DISTINCT visitor_id) as visitors,
              COUNT(*) as views
            FROM analytics_events
            WHERE created_at >= ? AND created_at <= ?
          `).get(slotStart.toISOString(), slotEnd.toISOString());
          visitors = Number(row?.visitors || 0);
          views = Number(row?.views || 0);
        } catch (e) {}
      } else {
        const events = readJsonEvents();
        const inSlot = events.filter(e => {
          const t = new Date(e.createdAt).getTime();
          return t >= slotStart.getTime() && t <= slotEnd.getTime();
        });
        visitors = new Set(inSlot.map(e => e.visitorId)).size;
        views = inSlot.length;
      }

      timeline.push({
        date: dateKey,
        label,
        visitors,
        views,
      });
    }
  } else {
    // Daily points (capped at 60 days)
    const pointsCount = Math.min(spanDays, 60);
    const actualStart = new Date(endDate.getTime() - pointsCount * 24 * 3600 * 1000);

    for (let i = 0; i < pointsCount; i++) {
      const cur = new Date(actualStart.getTime() + i * 24 * 3600 * 1000);
      const dayStart = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 0, 0, 0).toISOString();
      const dayEnd = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 23, 59, 59, 999).toISOString();
      const label = formatThaiDateLabel(cur);

      let visitors = 0;
      let views = 0;

      if (useSqlite && sqliteDb) {
        try {
          const row = sqliteDb.prepare(`
            SELECT 
              COUNT(DISTINCT visitor_id) as visitors,
              COUNT(*) as views
            FROM analytics_events
            WHERE created_at >= ? AND created_at <= ?
          `).get(dayStart, dayEnd);
          visitors = Number(row?.visitors || 0);
          views = Number(row?.views || 0);
        } catch (e) {}
      } else {
        const events = readJsonEvents();
        const inDay = events.filter(e => {
          const t = new Date(e.createdAt).getTime();
          return t >= new Date(dayStart).getTime() && t <= new Date(dayEnd).getTime();
        });
        visitors = new Set(inDay.map(e => e.visitorId)).size;
        views = inDay.length;
      }

      timeline.push({
        date: dayStart.slice(0, 10),
        label,
        visitors,
        views,
      });
    }
  }

  // Top 5 Dormitories for this historical period
  let topDormitories: TopDormitory[] = [];
  if (useSqlite && sqliteDb) {
    try {
      const sql = startAt
        ? `SELECT dormitory_id as id, dormitory_name as name, COUNT(*) as count
           FROM analytics_events
           WHERE event_name = 'dormitory_view' AND dormitory_id IS NOT NULL
             AND created_at >= ? AND created_at < ?
           GROUP BY dormitory_id, dormitory_name
           ORDER BY count DESC LIMIT 5`
        : `SELECT dormitory_id as id, dormitory_name as name, COUNT(*) as count
           FROM analytics_events
           WHERE event_name = 'dormitory_view' AND dormitory_id IS NOT NULL
             AND created_at < ?
           GROUP BY dormitory_id, dormitory_name
           ORDER BY count DESC LIMIT 5`;
      const params = startAt ? [startAt, endAt] : [endAt];
      const rows = sqliteDb.prepare(sql).all(...params);
      topDormitories = rows.map((r: any) => ({
        id: Number(r.id),
        name: r.name || `หอพัก #${r.id}`,
        count: Number(r.count),
      }));
    } catch (e) {
      console.warn('SQLite top dorms history error:', e);
    }
  } else {
    const events = readJsonEvents().filter(e => {
      const t = new Date(e.createdAt).getTime();
      return e.eventName === 'dormitory_view' && e.dormitoryId != null &&
        t < new Date(endAt).getTime() && (!startAt || t >= new Date(startAt).getTime());
    });
    const map = new Map<number, { name: string; count: number }>();
    for (const ev of events) {
      const id = ev.dormitoryId!;
      const name = ev.dormitoryName || `หอพัก #${id}`;
      if (!map.has(id)) map.set(id, { name, count: 0 });
      map.get(id)!.count++;
    }
    topDormitories = Array.from(map.entries())
      .map(([id, val]) => ({ id, name: val.name, count: val.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // Top 5 Searches for this historical period
  let topSearches: TopSearch[] = [];
  if (useSqlite && sqliteDb) {
    try {
      const sql = startAt
        ? `SELECT LOWER(TRIM(search_keyword)) as keyword, COUNT(*) as count
           FROM analytics_events
           WHERE event_name = 'search' AND search_keyword IS NOT NULL AND TRIM(search_keyword) != ''
             AND created_at >= ? AND created_at < ?
           GROUP BY LOWER(TRIM(search_keyword))
           ORDER BY count DESC LIMIT 5`
        : `SELECT LOWER(TRIM(search_keyword)) as keyword, COUNT(*) as count
           FROM analytics_events
           WHERE event_name = 'search' AND search_keyword IS NOT NULL AND TRIM(search_keyword) != ''
             AND created_at < ?
           GROUP BY LOWER(TRIM(search_keyword))
           ORDER BY count DESC LIMIT 5`;
      const params = startAt ? [startAt, endAt] : [endAt];
      const rows = sqliteDb.prepare(sql).all(...params);
      topSearches = rows.map((r: any) => ({
        keyword: String(r.keyword),
        count: Number(r.count),
      }));
    } catch (e) {
      console.warn('SQLite top search history error:', e);
    }
  } else {
    const events = readJsonEvents().filter(e => {
      const t = new Date(e.createdAt).getTime();
      return e.eventName === 'search' && e.searchKeyword && e.searchKeyword.trim() !== '' &&
        t < new Date(endAt).getTime() && (!startAt || t >= new Date(startAt).getTime());
    });
    const map = new Map<string, number>();
    for (const ev of events) {
      const kw = ev.searchKeyword!.trim().toLowerCase();
      map.set(kw, (map.get(kw) || 0) + 1);
    }
    topSearches = Array.from(map.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  return {
    period: 'historical',
    summary,
    timeline,
    topDormitories,
    topSearches,
    displayResetAt: getDisplayResetTimestamp(),
    historicalPeriod: {
      id: periodInfo?.id || 'historical',
      label: periodInfo?.label || 'ข้อมูลสถิติย้อนหลัง',
      startAt,
      endAt,
    },
  };
}

/**
 * Clear all events in database (used for testing or resetting)
 */
export function clearAllAnalyticsEvents(): void {
  if (useSqlite && sqliteDb) {
    try {
      sqliteDb.exec('DELETE FROM analytics_events;');
      sqliteDb.exec('DELETE FROM analytics_reset_history;');
      sqliteDb.exec('VACUUM;');
    } catch (e) {
      console.warn('Failed to clear SQLite events:', e);
    }
  }
  writeJsonEvents([]);
  writeJsonResetHistory([]);
}
