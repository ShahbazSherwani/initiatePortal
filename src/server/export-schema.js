import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function exportSchema() {
  try {
    console.log('🔄 Exporting database schema...');
    
    // Get all table schemas
    const schemaQuery = `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position;
    `;
    
    const result = await db.query(schemaQuery);
    
    let sqlScript = `-- Initiate Portal Database Schema Export
-- Generated: ${new Date().toISOString()}

`;
    
    // Group by table
    const tables = {};
    result.rows.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push(row);
    });
    
    // Generate CREATE TABLE statements
    for (const [tableName, columns] of Object.entries(tables)) {
      sqlScript += `CREATE TABLE ${tableName} (\n`;
      
      const columnDefs = columns.map(col => {
        let def = `  ${col.column_name} ${col.data_type}`;
        if (col.is_nullable === 'NO') def += ' NOT NULL';
        if (col.column_default) def += ` DEFAULT ${col.column_default}`;
        return def;
      });
      
      sqlScript += columnDefs.join(',\n');
      sqlScript += `\n);\n\n`;
    }
    
    // Save to file
    fs.writeFileSync('./database-schema.sql', sqlScript);
    console.log('✅ Schema exported to database-schema.sql');
    
    // Also export sample data (limited)
    console.log('🔄 Exporting sample data...');
    
    const sampleQueries = [
      'SELECT * FROM users LIMIT 5',
      'SELECT * FROM borrower_profiles LIMIT 3', 
      'SELECT * FROM investor_profiles LIMIT 3'
    ];
    
    let dataScript = '-- Sample Data Export\n\n';
    
    for (const query of sampleQueries) {
      try {
        const data = await db.query(query);
        const tableName = query.split(' FROM ')[1].split(' ')[0];
        
        if (data.rows.length > 0) {
          dataScript += `-- ${tableName} sample data\n`;
          data.rows.forEach(row => {
            const columns = Object.keys(row).join(', ');
            const values = Object.values(row).map(v => 
              v === null ? 'NULL' : `'${v.toString().replace(/'/g, "''")}'`
            ).join(', ');
            dataScript += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\n`;
          });
          dataScript += '\n';
        }
      } catch (err) {
        console.log(`⚠️ Could not export ${query}: ${err.message}`);
      }
    }
    
    fs.writeFileSync('./sample-data.sql', dataScript);
    console.log('✅ Sample data exported to sample-data.sql');
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await db.end();
  }
}

exportSchema();
