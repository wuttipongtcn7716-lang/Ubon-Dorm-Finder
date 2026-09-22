import { 
  getPgPool, 
  ensurePostgresInitialized, 
  isPostgresConfigured, 
  pgGetResetHistory,
  getPostgresConnectionString
} from '../src/lib/postgresDb';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('=== DORMIE UBU: POSTGRESQL MIGRATION & VERIFICATION TOOL ===\n');

  if (process.argv[2]) {
    process.env.DATABASE_URL = process.argv[2];
  }

  if (!isPostgresConfigured()) {
    console.log('[INFO] No DATABASE_URL or POSTGRES_URL detected in environment or argument.');
    console.log('To run this migration against your Cloud PostgreSQL:');
    console.log('  npx tsx scripts/migrate_to_postgres.ts "postgresql://user:pass@host:5432/dbname?sslmode=require"\n');
    process.exit(0);
  }

  const connStr = getPostgresConnectionString() || '';
  // Mask password for display
  const maskedConn = connStr.replace(/:([^:@]+)@/, ':****@');
  console.log(`Connecting to: ${maskedConn}`);

  console.log('Initializing schema & migrating reset history...');
  await ensurePostgresInitialized();

  const pool = getPgPool();
  if (!pool) {
    throw new Error('Failed to acquire PostgreSQL connection pool.');
  }

  // 1. Verify Tables
  const tablesRes = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('analytics_events', 'analytics_reset_history', 'admin_identifiers', 'admin_audit_logs', 'analytics_settings')
    ORDER BY table_name;
  `);
  console.log('Verified PostgreSQL tables in public schema:', tablesRes.rows.map(r => r.table_name));

  // 2. Verify Reset History
  const history = await pgGetResetHistory();
  console.log(`\nanalytics_reset_history count in PostgreSQL: ${history.length}`);
  if (history.length > 0) {
    console.log(`Latest reset point: ${history[0].resetAt} by ${history[0].createdBy}`);
    console.log(`Oldest reset point: ${history[history.length - 1].resetAt} by ${history[history.length - 1].createdBy}`);
  }

  // 3. Verify Events Count
  const eventsCountRes = await pool.query('SELECT COUNT(*) as c FROM analytics_events');
  console.log(`analytics_events count in PostgreSQL: ${eventsCountRes.rows[0]?.c}`);

  console.log('\n=== MIGRATION & HEALTH CHECK COMPLETE ===');
  await pool.end();
}

main().catch((err) => {
  console.error('\n[ERROR] Migration failed:', err);
  process.exit(1);
});
