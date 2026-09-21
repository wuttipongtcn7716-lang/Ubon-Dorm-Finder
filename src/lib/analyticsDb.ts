import fs from 'fs';
import path from 'path';

export type AnalyticsEventType = 
  | 'page_view' 
  | 'search' 
  | 'dormitory_view' 
  | 'map_click' 
  | 'navigation_click';

export type ActorType = 'user' | 'admin' | 'system';

export interface AnalyticsEventInput {
  eventName: AnalyticsEventType;
  sessionId: string;
  visitorId: string;
  actorType?: ActorType;
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
  actorType?: ActorType;
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
  fullDateLabel?: string;
  timeRangeLabel?: string;
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

export interface AdminAuditLogRecord {
  id: number;
  adminId: string;
  action: string;
  createdAt: string;
  metadata?: Record<string, any> | null;
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
export function resolveAnalyticsStorageConfig(customDbPath?: string) {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  const activeCustomPath = customDbPath || process.env.ANALYTICS_DB_PATH;
  if (activeCustomPath) {
    const dbPath = path.isAbsolute(activeCustomPath) ? activeCustomPath : path.join(process.cwd(), activeCustomPath);
    const jsonPath = dbPath.replace(/\.db$/, '_events.json');
    const settingsJsonPath = dbPath.replace(/\.db$/, '_settings.json');
    const historyJsonPath = dbPath.replace(/\.db$/, '_history.json');
    const auditJsonPath = dbPath.replace(/\.db$/, '_audit.json');
    const adminIdentifiersJsonPath = dbPath.replace(/\.db$/, '_admin_identifiers.json');
    return { environment: nodeEnv, dbPath, jsonPath, settingsJsonPath, historyJsonPath, auditJsonPath, adminIdentifiersJsonPath, isProduction: isProd };
  }

  let dataDir: string;
  let dbFileName: string;
  let jsonFileName: string;
  let settingsFileName: string;
  let historyFileName: string;
  let auditFileName: string;
  let adminIdentifiersFileName: string;

  if (isProd) {
    dataDir = isServerless ? '/tmp' : path.join(process.cwd(), 'data');
    dbFileName = 'analytics.prod.db';
    jsonFileName = 'analytics_events.prod.json';
    settingsFileName = 'analytics_settings.prod.json';
    historyFileName = 'analytics_reset_history.prod.json';
    auditFileName = 'admin_audit_logs.prod.json';
    adminIdentifiersFileName = 'admin_identifiers.prod.json';
  } else if (isTest) {
    dataDir = path.join(process.cwd(), 'data');
    dbFileName = 'analytics.test.db';
    jsonFileName = 'analytics_events.test.json';
    settingsFileName = 'analytics_settings.test.json';
    historyFileName = 'analytics_reset_history.test.json';
    auditFileName = 'admin_audit_logs.test.json';
    adminIdentifiersFileName = 'admin_identifiers.test.json';
  } else {
    dataDir = path.join(process.cwd(), 'data');
    dbFileName = 'analytics.dev.db';
    jsonFileName = 'analytics_events.dev.json';
    settingsFileName = 'analytics_settings.dev.json';
    historyFileName = 'analytics_reset_history.dev.json';
    auditFileName = 'admin_audit_logs.dev.json';
    adminIdentifiersFileName = 'admin_identifiers.dev.json';
  }

  return {
    environment: nodeEnv,
    dbPath: path.join(dataDir, dbFileName),
    jsonPath: path.join(dataDir, jsonFileName),
    settingsJsonPath: path.join(dataDir, settingsFileName),
    historyJsonPath: path.join(dataDir, historyFileName),
    auditJsonPath: path.join(dataDir, auditFileName),
    adminIdentifiersJsonPath: path.join(dataDir, adminIdentifiersFileName),
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
      actor_type TEXT DEFAULT 'user',
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
    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at TEXT NOT NULL,
      metadata TEXT
    );
    CREATE TABLE IF NOT EXISTS admin_identifiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifier_type TEXT NOT NULL,
      identifier_value TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_event_name ON analytics_events(event_name);
    CREATE INDEX IF NOT EXISTS idx_created_at ON analytics_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_visitor_id ON analytics_events(visitor_id);
    CREATE INDEX IF NOT EXISTS idx_dormitory_id ON analytics_events(dormitory_id);
    CREATE INDEX IF NOT EXISTS idx_reset_at ON analytics_reset_history(reset_at);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_created_at ON admin_audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_admin_id_type_val ON admin_identifiers(identifier_type, identifier_value);
  `);

  // Safely migrate existing databases: add actor_type column if not present
  try {
    sqliteDb.exec(`ALTER TABLE analytics_events ADD COLUMN actor_type TEXT DEFAULT 'user';`);
  } catch (e) {}
  try {
    sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_actor_type ON analytics_events(actor_type);`);
  } catch (e) {}

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

// Helper: read JSON audit logs fallback
function readJsonAuditLogs(): AdminAuditLogRecord[] {
  try {
    if (!fs.existsSync(activeConfig.auditJsonPath)) return [];
    const raw = fs.readFileSync(activeConfig.auditJsonPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

// Helper: write JSON audit logs fallback
function writeJsonAuditLogs(logs: AdminAuditLogRecord[]) {
  try {
    fs.writeFileSync(activeConfig.auditJsonPath, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write JSON audit logs:', err);
  }
}

// Helper: read JSON admin identifiers fallback
function readJsonAdminIdentifiers(): { identifierType: string; identifierValue: string; createdAt: string }[] {
  try {
    if (!fs.existsSync(activeConfig.adminIdentifiersJsonPath)) return [];
    const raw = fs.readFileSync(activeConfig.adminIdentifiersJsonPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

// Helper: write JSON admin identifiers fallback
function writeJsonAdminIdentifiers(list: { identifierType: string; identifierValue: string; createdAt: string }[]) {
  try {
    fs.writeFileSync(activeConfig.adminIdentifiersJsonPath, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write JSON admin identifiers:', err);
  }
}

/**
 * Register a visitorId or sessionId as belonging to an authenticated Admin.
 * Any existing or future events matching these identifiers will be strictly excluded from User Analytics.
 */
export function registerAdminIdentifier(type: 'visitor_id' | 'session_id', value: string): void {
  if (!value || typeof value !== 'string') return;
  const cleanVal = value.trim();
  if (!cleanVal) return;

  const now = new Date().toISOString();

  if (useSqlite && sqliteDb) {
    try {
      sqliteDb.prepare(`
        INSERT OR IGNORE INTO admin_identifiers (identifier_type, identifier_value, created_at)
        VALUES (?, ?, ?)
      `).run(type, cleanVal, now);

      // Also tag any previously recorded events from this admin identifier as actor_type = 'admin'
      sqliteDb.prepare(`
        UPDATE analytics_events 
        SET actor_type = 'admin' 
        WHERE (visitor_id = ? OR session_id = ?) AND (actor_type = 'user' OR actor_type IS NULL)
      `).run(cleanVal, cleanVal);
    } catch (e) {
      console.warn('Failed to register admin identifier in SQLite:', e);
    }
  }

  // Fallback JSON persistence
  try {
    const list = readJsonAdminIdentifiers();
    if (!list.some(item => item.identifierType === type && item.identifierValue === cleanVal)) {
      list.push({ identifierType: type, identifierValue: cleanVal, createdAt: now });
      writeJsonAdminIdentifiers(list);
    }
    // Tag existing JSON events
    const events = readJsonEvents();
    let updated = false;
    events.forEach(ev => {
      if ((ev.visitorId === cleanVal || ev.sessionId === cleanVal) && ev.actorType !== 'admin') {
        ev.actorType = 'admin';
        updated = true;
      }
    });
    if (updated) {
      writeJsonEvents(events);
    }
  } catch (e) {}
}

/**
 * Get all known Admin visitor and session IDs
 */
export function getKnownAdminIdentifiers(): { visitorIds: Set<string>; sessionIds: Set<string> } {
  const visitorIds = new Set<string>();
  const sessionIds = new Set<string>();

  if (useSqlite && sqliteDb) {
    try {
      const rows = sqliteDb.prepare(`SELECT identifier_type, identifier_value FROM admin_identifiers`).all();
      for (const row of rows) {
        if (row.identifier_type === 'visitor_id') visitorIds.add(String(row.identifier_value));
        if (row.identifier_type === 'session_id') sessionIds.add(String(row.identifier_value));
      }
      return { visitorIds, sessionIds };
    } catch (e) {}
  }

  try {
    const list = readJsonAdminIdentifiers();
    for (const item of list) {
      if (item.identifierType === 'visitor_id') visitorIds.add(String(item.identifierValue));
      if (item.identifierType === 'session_id') sessionIds.add(String(item.identifierValue));
    }
  } catch (e) {}

  return { visitorIds, sessionIds };
}

/**
 * Check if a given visitorId or sessionId belongs to an authenticated Admin
 */
export function isKnownAdminIdentifier(visitorId?: string | null, sessionId?: string | null): boolean {
  if (!visitorId && !sessionId) return false;
  const { visitorIds, sessionIds } = getKnownAdminIdentifiers();
  if (visitorId && visitorIds.has(visitorId)) return true;
  if (sessionId && sessionIds.has(sessionId)) return true;
  return false;
}

/**
 * Log an administrative action to admin_audit_logs table.
 * Stored independently and strictly excluded from user analytics.
 */
export function logAdminAudit(
  adminId: string, 
  action: string, 
  metadata?: Record<string, any>
): AdminAuditLogRecord {
  const createdAt = new Date().toISOString();
  const metadataStr = metadata ? JSON.stringify(metadata) : null;

  if (useSqlite && sqliteDb) {
    try {
      const info = sqliteDb.prepare(`
        INSERT INTO admin_audit_logs (admin_id, action, created_at, metadata)
        VALUES (?, ?, ?, ?)
      `).run(adminId, action, createdAt, metadataStr);

      return {
        id: Number(info.lastInsertRowid),
        adminId,
        action,
        createdAt,
        metadata: metadata || null,
      };
    } catch (e) {
      console.warn('SQLite logAdminAudit error, fallback to JSON:', e);
    }
  }

  const list = readJsonAuditLogs();
  const newRec: AdminAuditLogRecord = {
    id: list.length > 0 ? Math.max(...list.map((x) => x.id)) + 1 : 1,
    adminId,
    action,
    createdAt,
    metadata: metadata || null,
  };
  list.push(newRec);
  writeJsonAuditLogs(list);
  return newRec;
}

/**
 * Retrieve recent administrative audit logs.
 */
export function getAdminAuditLogs(limit = 100): AdminAuditLogRecord[] {
  if (useSqlite && sqliteDb) {
    try {
      const rows = sqliteDb.prepare(`
        SELECT id, admin_id as adminId, action, created_at as createdAt, metadata
        FROM admin_audit_logs
        ORDER BY id DESC
        LIMIT ?
      `).all(limit);

      return rows.map((r: any) => ({
        id: Number(r.id),
        adminId: String(r.adminId),
        action: String(r.action),
        createdAt: String(r.createdAt),
        metadata: r.metadata ? JSON.parse(r.metadata) : null,
      }));
    } catch (e) {
      console.warn('SQLite getAdminAuditLogs error, fallback to JSON:', e);
    }
  }

  const list = readJsonAuditLogs();
  return list.slice(-limit).reverse();
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
export function recordEvent(event: AnalyticsEventInput): StoredAnalyticsEvent | null {
  // If explicitly admin or matches known admin identifiers, do NOT insert into user analytics
  if (
    event.actorType === 'admin' ||
    isKnownAdminIdentifier(event.visitorId, event.sessionId)
  ) {
    return null;
  }

  const actorType: ActorType = event.actorType || 'user';
  const createdAt = event.createdAt || new Date().toISOString();
  const metadataStr = event.metadata ? JSON.stringify(event.metadata) : null;

  if (useSqlite && sqliteDb) {
    try {
      const stmt = sqliteDb.prepare(`
        INSERT INTO analytics_events 
        (event_name, session_id, visitor_id, actor_type, user_id, page, dormitory_id, dormitory_name, search_keyword, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const res = stmt.run(
        event.eventName,
        event.sessionId,
        event.visitorId,
        actorType,
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
        actorType,
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
    actorType,
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
 * Excludes Admin activity strictly from user analytics
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
            AND (actor_type = 'user' OR actor_type IS NULL)
            AND (user_id IS NULL OR user_id != 'admin')
            AND visitor_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'visitor_id')
            AND session_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'session_id')
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
  const { visitorIds: adminVis, sessionIds: adminSes } = getKnownAdminIdentifiers();
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
    const subset = events.filter(e => 
      inRange(e.createdAt, range.start, range.end) &&
      e.actorType !== 'admin' &&
      e.actorType !== 'system' &&
      (e.userId === null || e.userId !== 'admin') &&
      !adminVis.has(e.visitorId) &&
      !adminSes.has(e.sessionId)
    );
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
 * Timezone & Localization for Thailand (Asia/Bangkok, UTC+7)
 */
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

function formatThaiDateLabel(d: Date): string {
  const bkk = new Date(d.getTime() + BANGKOK_OFFSET_MS);
  const day = bkk.getUTCDate();
  const month = THAI_MONTHS_SHORT[bkk.getUTCMonth()];
  return `${day} ${month}`;
}

function formatThaiFullDate(d: Date): string {
  const bkk = new Date(d.getTime() + BANGKOK_OFFSET_MS);
  const day = bkk.getUTCDate();
  const month = THAI_MONTHS_FULL[bkk.getUTCMonth()];
  const year = bkk.getUTCFullYear() + 543;
  return `${day} ${month} ${year}`;
}

/**
 * Get timeline data for Main Chart
 * Period < 24h ('today') aggregates strictly by 1 hour (00:00 to 23:00) in Bangkok Time
 * Period >= 24h ('7d', '30d', '90d') aggregates daily
 */
export function getTimelineData(period: PeriodType): TimelineDataPoint[] {
  const now = new Date();
  const points: TimelineDataPoint[] = [];
  const resetAt = getDisplayResetTimestamp();

  if (period === 'today') {
    // Determine start of today in Asia/Bangkok (00:00:00 Bangkok)
    const nowBkk = new Date(now.getTime() + BANGKOK_OFFSET_MS);
    const startOfTodayBkkUtc = Date.UTC(
      nowBkk.getUTCFullYear(),
      nowBkk.getUTCMonth(),
      nowBkk.getUTCDate(),
      0, 0, 0
    ) - BANGKOK_OFFSET_MS;

    // Generate strictly every 1 hour (24 slots: 00:00, 01:00, ..., 23:00)
    for (let hour = 0; hour < 24; hour++) {
      const slotStartMs = startOfTodayBkkUtc + hour * 3600 * 1000;
      const slotEndMs = slotStartMs + 3600 * 1000 - 1;
      const slotStartDate = new Date(slotStartMs);
      const slotEndDate = new Date(slotEndMs);

      const hourStr = String(hour).padStart(2, '0');
      const label = `${hourStr}:00`;
      const fullDateLabel = formatThaiFullDate(slotStartDate);
      const timeRangeLabel = `เวลา ${label}–${hourStr}:59`;

      const range = applyResetToRange(slotStartDate.toISOString(), slotEndDate.toISOString(), resetAt);

      let visitors = 0;
      let views = 0;

      if (range.isValid) {
        if (useSqlite && sqliteDb) {
          try {
            const row = sqliteDb.prepare(`
              SELECT 
                COUNT(DISTINCT session_id) as visitors,
                COUNT(*) as views
              FROM analytics_events
              WHERE created_at >= ? AND created_at <= ?
                AND (actor_type = 'user' OR actor_type IS NULL)
                AND (user_id IS NULL OR user_id != 'admin')
                AND visitor_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'visitor_id')
                AND session_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'session_id')
            `).get(range.start, range.end);
            visitors = Number(row?.visitors || 0);
            views = Number(row?.views || 0);
          } catch (e) {
            // ignore
          }
        } else {
          const events = readJsonEvents();
          const { visitorIds: adminVis, sessionIds: adminSes } = getKnownAdminIdentifiers();
          const inSlot = events.filter((e) => {
            const t = new Date(e.createdAt).getTime();
            return (
              t >= new Date(range.start).getTime() && 
              t <= new Date(range.end).getTime() &&
              e.actorType !== 'admin' &&
              e.actorType !== 'system' &&
              (e.userId === null || e.userId !== 'admin') &&
              !adminVis.has(e.visitorId) &&
              !adminSes.has(e.sessionId)
            );
          });
          visitors = new Set(inSlot.map((e) => e.sessionId)).size;
          views = inSlot.length;
        }
      }

      points.push({
        date: slotStartDate.toISOString(),
        label,
        visitors,
        views,
        fullDateLabel,
        timeRangeLabel,
      });
    }
    return points;
  }

  // For 7d, 30d, 90d: Generate daily data points
  const daysCount = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const nowBkk = new Date(now.getTime() + BANGKOK_OFFSET_MS);
  const startDayBkkUtc = Date.UTC(
    nowBkk.getUTCFullYear(),
    nowBkk.getUTCMonth(),
    nowBkk.getUTCDate() - (daysCount - 1),
    0, 0, 0
  ) - BANGKOK_OFFSET_MS;

  for (let i = 0; i < daysCount; i++) {
    const dayStartMs = startDayBkkUtc + i * 24 * 60 * 60 * 1000;
    const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000 - 1;
    const dayStartDate = new Date(dayStartMs);
    const dayEndDate = new Date(dayEndMs);

    const label = formatThaiDateLabel(dayStartDate);
    const fullDateLabel = formatThaiFullDate(dayStartDate);
    const timeRangeLabel = 'ตลอดทั้งวัน (00:00–23:59)';

    const range = applyResetToRange(dayStartDate.toISOString(), dayEndDate.toISOString(), resetAt);

    let visitors = 0;
    let views = 0;

    if (range.isValid) {
      if (useSqlite && sqliteDb) {
        try {
          const row = sqliteDb.prepare(`
            SELECT 
              COUNT(DISTINCT session_id) as visitors,
              COUNT(*) as views
            FROM analytics_events
            WHERE created_at >= ? AND created_at <= ?
              AND (actor_type = 'user' OR actor_type IS NULL)
              AND (user_id IS NULL OR user_id != 'admin')
              AND visitor_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'visitor_id')
              AND session_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'session_id')
          `).get(range.start, range.end);
          visitors = Number(row?.visitors || 0);
          views = Number(row?.views || 0);
        } catch (e) {
          // ignore
        }
      } else {
        const events = readJsonEvents();
        const { visitorIds: adminVis, sessionIds: adminSes } = getKnownAdminIdentifiers();
        const inDay = events.filter((e) => {
          const t = new Date(e.createdAt).getTime();
          return (
            t >= new Date(range.start).getTime() && 
            t <= new Date(range.end).getTime() &&
            e.actorType !== 'admin' &&
            e.actorType !== 'system' &&
            (e.userId === null || e.userId !== 'admin') &&
            !adminVis.has(e.visitorId) &&
            !adminSes.has(e.sessionId)
          );
        });
        visitors = new Set(inDay.map((e) => e.sessionId)).size;
        views = inDay.length;
      }
    }

    points.push({
      date: dayStartDate.toISOString(),
      label,
      visitors,
      views,
      fullDateLabel,
      timeRangeLabel,
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
          AND (actor_type = 'user' OR actor_type IS NULL)
          AND (user_id IS NULL OR user_id != 'admin')
          AND visitor_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'visitor_id')
          AND session_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'session_id')
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
  const { visitorIds: adminVis, sessionIds: adminSes } = getKnownAdminIdentifiers();
  const subset = events.filter(e => {
    const t = new Date(e.createdAt).getTime();
    return (
      e.eventName === 'dormitory_view' && 
      e.dormitoryId != null &&
      e.actorType !== 'admin' &&
      e.actorType !== 'system' &&
      (e.userId === null || e.userId !== 'admin') &&
      !adminVis.has(e.visitorId) &&
      !adminSes.has(e.sessionId) &&
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
          AND (actor_type = 'user' OR actor_type IS NULL)
          AND (user_id IS NULL OR user_id != 'admin')
          AND visitor_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'visitor_id')
          AND session_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'session_id')
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
  const { visitorIds: adminVis, sessionIds: adminSes } = getKnownAdminIdentifiers();
  const subset = events.filter(e => {
    const t = new Date(e.createdAt).getTime();
    return (
      e.eventName === 'search' && 
      e.searchKeyword && 
      e.searchKeyword.trim() !== '' &&
      e.actorType !== 'admin' &&
      e.actorType !== 'system' &&
      (e.userId === null || e.userId !== 'admin') &&
      !adminVis.has(e.visitorId) &&
      !adminSes.has(e.sessionId) &&
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
          WHERE created_at >= ? AND created_at < ?
            AND (actor_type = 'user' OR actor_type IS NULL)
            AND (user_id IS NULL OR user_id != 'admin')
            AND visitor_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'visitor_id')
            AND session_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'session_id')`
        : `SELECT 
            COUNT(DISTINCT visitor_id) as unique_visitors,
            SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) as page_views,
            SUM(CASE WHEN event_name = 'search' THEN 1 ELSE 0 END) as search_events,
            SUM(CASE WHEN event_name = 'dormitory_view' THEN 1 ELSE 0 END) as dorm_views
          FROM analytics_events
          WHERE created_at < ?
            AND (actor_type = 'user' OR actor_type IS NULL)
            AND (user_id IS NULL OR user_id != 'admin')
            AND visitor_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'visitor_id')
            AND session_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'session_id')`;

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
  const { visitorIds: adminVis, sessionIds: adminSes } = getKnownAdminIdentifiers();
  const subset = events.filter((e) => {
    const t = new Date(e.createdAt).getTime();
    const endT = new Date(endAt).getTime();
    if (t >= endT) return false;
    if (startAt && t < new Date(startAt).getTime()) return false;
    if (e.actorType === 'admin' || e.actorType === 'system') return false;
    if (e.userId === 'admin') return false;
    if (adminVis.has(e.visitorId) || adminSes.has(e.sessionId)) return false;
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
        const row = sqliteDb.prepare(`
          SELECT MIN(created_at) as min_date 
          FROM analytics_events 
          WHERE created_at < ? 
            AND (actor_type = 'user' OR actor_type IS NULL)
            AND (user_id IS NULL OR user_id != 'admin')
        `).get(endAt);
        if (row && row.min_date) {
          earliestTime = new Date(row.min_date).getTime();
        }
      } catch (e) {}
    }
    if (!earliestTime) {
      const { visitorIds: adminVis, sessionIds: adminSes } = getKnownAdminIdentifiers();
      const events = readJsonEvents().filter((e) => 
        new Date(e.createdAt).getTime() < endDate.getTime() &&
        e.actorType !== 'admin' &&
        e.actorType !== 'system' &&
        (e.userId === null || e.userId !== 'admin') &&
        !adminVis.has(e.visitorId) &&
        !adminSes.has(e.sessionId)
      );
      if (events.length > 0) {
        earliestTime = new Date(events[0].createdAt).getTime();
      }
    }
    startDate = earliestTime ? new Date(earliestTime) : new Date(endDate.getTime() - 7 * 24 * 3600 * 1000);
  }

  const timeline: TimelineDataPoint[] = [];
  const durationMs = endDate.getTime() - startDate.getTime();
  const isHourly = durationMs < 24 * 3600 * 1000;

  if (isHourly) {
    // Generate strictly every 1 hour (hourly buckets) in Asia/Bangkok Time
    const startBkkMs = startDate.getTime() + BANGKOK_OFFSET_MS;
    const flooredStartBkkMs = Math.floor(startBkkMs / (3600 * 1000)) * (3600 * 1000);
    const startHourUtcMs = flooredStartBkkMs - BANGKOK_OFFSET_MS;

    const endBkkMs = endDate.getTime() + BANGKOK_OFFSET_MS;
    const ceiledEndBkkMs = Math.ceil(endBkkMs / (3600 * 1000)) * (3600 * 1000);
    const endHourUtcMs = ceiledEndBkkMs - BANGKOK_OFFSET_MS;

    const countHours = Math.max(1, Math.min(Math.round((endHourUtcMs - startHourUtcMs) / (3600 * 1000)), 24));

    for (let i = 0; i < countHours; i++) {
      const slotStartMs = startHourUtcMs + i * 3600 * 1000;
      const slotEndMs = slotStartMs + 3600 * 1000 - 1;
      const slotStartDate = new Date(slotStartMs);
      const slotEndDate = new Date(slotEndMs);

      const bkkDate = new Date(slotStartMs + BANGKOK_OFFSET_MS);
      const bkkHour = bkkDate.getUTCHours();
      const hourStr = String(bkkHour).padStart(2, '0');
      const label = `${hourStr}:00`;
      const fullDateLabel = formatThaiFullDate(slotStartDate);
      const timeRangeLabel = `เวลา ${label}–${hourStr}:59`;

      let visitors = 0;
      let views = 0;

      if (useSqlite && sqliteDb) {
        try {
          const row = sqliteDb.prepare(`
            SELECT 
              COUNT(DISTINCT session_id) as visitors,
              COUNT(*) as views
            FROM analytics_events
            WHERE created_at >= ? AND created_at <= ?
              AND (actor_type = 'user' OR actor_type IS NULL)
              AND (user_id IS NULL OR user_id != 'admin')
              AND visitor_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'visitor_id')
              AND session_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'session_id')
          `).get(slotStartDate.toISOString(), slotEndDate.toISOString());
          visitors = Number(row?.visitors || 0);
          views = Number(row?.views || 0);
        } catch (e) {}
      } else {
        const events = readJsonEvents();
        const { visitorIds: adminVis, sessionIds: adminSes } = getKnownAdminIdentifiers();
        const inSlot = events.filter((e) => {
          const t = new Date(e.createdAt).getTime();
          return (
            t >= slotStartMs && 
            t <= slotEndMs &&
            e.actorType !== 'admin' &&
            e.actorType !== 'system' &&
            (e.userId === null || e.userId !== 'admin') &&
            !adminVis.has(e.visitorId) &&
            !adminSes.has(e.sessionId)
          );
        });
        visitors = new Set(inSlot.map((e) => e.sessionId)).size;
        views = inSlot.length;
      }

      timeline.push({
        date: slotStartDate.toISOString(),
        label,
        visitors,
        views,
        fullDateLabel,
        timeRangeLabel,
      });
    }
  } else {
    // Daily points (capped at 60 days)
    const spanDays = Math.max(1, Math.ceil(durationMs / (24 * 3600 * 1000)));
    const pointsCount = Math.min(spanDays, 60);
    const nowBkk = new Date(endDate.getTime() + BANGKOK_OFFSET_MS);
    const startDayBkkUtc = Date.UTC(
      nowBkk.getUTCFullYear(),
      nowBkk.getUTCMonth(),
      nowBkk.getUTCDate() - (pointsCount - 1),
      0, 0, 0
    ) - BANGKOK_OFFSET_MS;

    for (let i = 0; i < pointsCount; i++) {
      const dayStartMs = startDayBkkUtc + i * 24 * 60 * 60 * 1000;
      const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000 - 1;
      const dayStartDate = new Date(dayStartMs);
      const dayEndDate = new Date(dayEndMs);

      const label = formatThaiDateLabel(dayStartDate);
      const fullDateLabel = formatThaiFullDate(dayStartDate);
      const timeRangeLabel = 'ตลอดทั้งวัน (00:00–23:59)';

      let visitors = 0;
      let views = 0;

      if (useSqlite && sqliteDb) {
        try {
          const row = sqliteDb.prepare(`
            SELECT 
              COUNT(DISTINCT session_id) as visitors,
              COUNT(*) as views
            FROM analytics_events
            WHERE created_at >= ? AND created_at <= ?
              AND (actor_type = 'user' OR actor_type IS NULL)
              AND (user_id IS NULL OR user_id != 'admin')
              AND visitor_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'visitor_id')
              AND session_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'session_id')
          `).get(dayStartDate.toISOString(), dayEndDate.toISOString());
          visitors = Number(row?.visitors || 0);
          views = Number(row?.views || 0);
        } catch (e) {}
      } else {
        const events = readJsonEvents();
        const { visitorIds: adminVis, sessionIds: adminSes } = getKnownAdminIdentifiers();
        const inDay = events.filter((e) => {
          const t = new Date(e.createdAt).getTime();
          return (
            t >= dayStartMs && 
            t <= dayEndMs &&
            e.actorType !== 'admin' &&
            e.actorType !== 'system' &&
            (e.userId === null || e.userId !== 'admin') &&
            !adminVis.has(e.visitorId) &&
            !adminSes.has(e.sessionId)
          );
        });
        visitors = new Set(inDay.map((e) => e.sessionId)).size;
        views = inDay.length;
      }

      timeline.push({
        date: dayStartDate.toISOString(),
        label,
        visitors,
        views,
        fullDateLabel,
        timeRangeLabel,
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
             AND (actor_type = 'user' OR actor_type IS NULL)
             AND (user_id IS NULL OR user_id != 'admin')
             AND visitor_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'visitor_id')
             AND session_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'session_id')
           GROUP BY dormitory_id, dormitory_name
           ORDER BY count DESC LIMIT 5`
        : `SELECT dormitory_id as id, dormitory_name as name, COUNT(*) as count
           FROM analytics_events
           WHERE event_name = 'dormitory_view' AND dormitory_id IS NOT NULL
             AND created_at < ?
             AND (actor_type = 'user' OR actor_type IS NULL)
             AND (user_id IS NULL OR user_id != 'admin')
             AND visitor_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'visitor_id')
             AND session_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'session_id')
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
    const { visitorIds: adminVis, sessionIds: adminSes } = getKnownAdminIdentifiers();
    const events = readJsonEvents().filter(e => {
      const t = new Date(e.createdAt).getTime();
      return (
        e.eventName === 'dormitory_view' && 
        e.dormitoryId != null &&
        e.actorType !== 'admin' &&
        e.actorType !== 'system' &&
        (e.userId === null || e.userId !== 'admin') &&
        !adminVis.has(e.visitorId) &&
        !adminSes.has(e.sessionId) &&
        t < new Date(endAt).getTime() && 
        (!startAt || t >= new Date(startAt).getTime())
      );
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
             AND (actor_type = 'user' OR actor_type IS NULL)
             AND (user_id IS NULL OR user_id != 'admin')
             AND visitor_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'visitor_id')
             AND session_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'session_id')
           GROUP BY LOWER(TRIM(search_keyword))
           ORDER BY count DESC LIMIT 5`
        : `SELECT LOWER(TRIM(search_keyword)) as keyword, COUNT(*) as count
           FROM analytics_events
           WHERE event_name = 'search' AND search_keyword IS NOT NULL AND TRIM(search_keyword) != ''
             AND created_at < ?
             AND (actor_type = 'user' OR actor_type IS NULL)
             AND (user_id IS NULL OR user_id != 'admin')
             AND visitor_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'visitor_id')
             AND session_id NOT IN (SELECT identifier_value FROM admin_identifiers WHERE identifier_type = 'session_id')
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
    const { visitorIds: adminVis, sessionIds: adminSes } = getKnownAdminIdentifiers();
    const events = readJsonEvents().filter(e => {
      const t = new Date(e.createdAt).getTime();
      return (
        e.eventName === 'search' && 
        e.searchKeyword && 
        e.searchKeyword.trim() !== '' &&
        e.actorType !== 'admin' &&
        e.actorType !== 'system' &&
        (e.userId === null || e.userId !== 'admin') &&
        !adminVis.has(e.visitorId) &&
        !adminSes.has(e.sessionId) &&
        t < new Date(endAt).getTime() && 
        (!startAt || t >= new Date(startAt).getTime())
      );
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
