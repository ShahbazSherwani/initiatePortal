#!/usr/bin/env node

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MigrationRunner {
  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('❌ DATABASE_URL environment variable is required');
      process.exit(1);
    }

    this.pool = new Pool({
      connectionString: dbUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 5, // Limit connections for production
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Add connection error handling
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(1);
    });
  }

  async runMigrations() {
    let client;
    
    try {
      console.log('🚀 Starting database migrations...');
      console.log('🔌 Connecting to database...');
      
      client = await this.pool.connect();
      console.log('✅ Database connection established');
      
      // Test connection
      await client.query('SELECT 1');
      console.log('✅ Database connection verified');
      
      // Get all migration files
      const migrationsDir = path.join(__dirname);
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql') && file !== 'migrate.js')
        .sort();

      if (migrationFiles.length === 0) {
        console.log('📝 No migration files found.');
        return;
      }

      console.log(`📋 Found ${migrationFiles.length} migration(s):`, migrationFiles);

      // Run each migration
      for (const file of migrationFiles) {
        const filePath = path.join(migrationsDir, file);
        const migrationSQL = fs.readFileSync(filePath, 'utf8');
        
        console.log(`⚡ Executing migration: ${file}`);
        
        try {
          // Execute the migration within a transaction
          await client.query('BEGIN');
          await client.query(migrationSQL);
          await client.query('COMMIT');
          
          console.log(`✅ Migration ${file} completed successfully`);
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`❌ Migration ${file} failed:`, error.message);
          throw error;
        }
      }

      // Verify results
      await this.verifyMigration(client);
      
      console.log('🎉 All migrations completed successfully!');
      
    } catch (error) {
      console.error('💥 Migration process failed:', error);
      process.exit(1);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  async verifyMigration(client) {
    try {
      console.log('\n📊 Verifying migration results...');
      
      // Check migration log
      const migrationLog = await client.query(`
        SELECT migration_name, executed_at 
        FROM schema_migrations 
        ORDER BY executed_at DESC
        LIMIT 5
      `);
      
      console.log('Recent migrations:');
      migrationLog.rows.forEach(row => {
        console.log(`  ✓ ${row.migration_name} (${row.executed_at})`);
      });

      // Check account flags status
      const accountStats = await client.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN has_borrower_account THEN 1 END) as borrower_accounts,
          COUNT(CASE WHEN has_investor_account THEN 1 END) as investor_accounts,
          COUNT(CASE WHEN has_borrower_account AND has_investor_account THEN 1 END) as dual_accounts
        FROM users 
        WHERE has_completed_registration = true
      `);
      
      const stats = accountStats.rows[0];
      console.log('\nAccount Statistics:');
      console.log(`  👥 Total registered users: ${stats.total_users}`);
      console.log(`  🏦 Users with borrower accounts: ${stats.borrower_accounts}`);
      console.log(`  📈 Users with investor accounts: ${stats.investor_accounts}`);
      console.log(`  🔄 Users with dual accounts: ${stats.dual_accounts}`);

    } catch (error) {
      console.error('⚠️  Verification failed:', error.message);
    }
  }

  async close() {
    await this.pool.end();
  }
}

// Production-ready execution
async function main() {
  const runner = new MigrationRunner();
  
  // Set a timeout for the migration process
  const timeout = setTimeout(() => {
    console.error('⏰ Migration timeout after 2 minutes');
    process.exit(1);
  }, 120000); // 2 minutes timeout
  
  try {
    await runner.runMigrations();
    clearTimeout(timeout);
  } finally {
    await runner.close();
  }
}

// Handle production errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Run migrations
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MigrationRunner };
