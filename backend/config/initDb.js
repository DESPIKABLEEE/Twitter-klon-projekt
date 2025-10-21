const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('Initializing database tables...');
    
    const { promisePool } = require('./database');
    const sqlFilePath = path.join(__dirname, '../database/init.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL statements and execute them
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await promisePool.query(statement);
          console.log('✓ Executed:', statement.substring(0, 50) + '...');
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DB_CREATE_EXISTS' || error.message.includes('already exists')) {
            console.log('ℹ Already exists, skipping...');
          } else if (error.code === 'ER_NO_DB_ERROR') {
            console.log('ℹ Database creation in progress...');
          } else {
            console.warn('⚠ Warning:', error.message.substring(0, 100));
          }
        }
      }
    }
    
    console.log('✓ Database initialization completed!');
  } catch (error) {
    console.error('✗ Failed to initialize database:', error.message);
    // Don't throw, just log - server can still run without tables for testing
  }
}

module.exports = { initializeDatabase };
