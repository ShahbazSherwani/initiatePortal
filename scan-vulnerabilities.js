// scan-vulnerabilities.js
// Manual vulnerability scan script
import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

import VulnerabilityScanner from './src/server/vulnerability-scanner.js';

const { Pool } = pg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? {
    rejectUnauthorized: false
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

async function main() {
  console.log('🔐 Initiating Vulnerability Scan...\n');
  
  try {
    const scanner = new VulnerabilityScanner(db);
    const result = await scanner.runFullScan();
    
    console.log('\n📊 Scan Summary:');
    console.log(`   Scan ID: ${result.scanId}`);
    console.log(`   Total Vulnerabilities: ${result.stats.total}`);
    console.log(`   Critical: ${result.stats.critical}`);
    console.log(`   High: ${result.stats.high}`);
    console.log(`   Moderate: ${result.stats.moderate}`);
    console.log(`   Low: ${result.stats.low}`);
    console.log(`   Fixable: ${result.stats.fixable}`);
    
    if (result.stats.fixable > 0) {
      console.log('\n💡 Recommended Actions:');
      console.log('   1. Run: npm audit fix');
      console.log('   2. For breaking changes: npm audit fix --force');
      console.log('   3. Review each vulnerability in admin dashboard');
    }
    
    if (result.stats.critical > 0 || result.stats.high > 0) {
      console.log('\n⚠️  ACTION REQUIRED: Critical/High severity vulnerabilities detected!');
      process.exit(1);
    }
    
    console.log('\n✅ Scan completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Scan failed:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();
