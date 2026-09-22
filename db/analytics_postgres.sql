-- ==========================================================
-- DORMIE UBU ANALYTICS SCHEMA FOR POSTGRESQL (Production)
-- รองรับ Supabase, Neon, Vercel Postgres, AWS RDS
-- ==========================================================

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
