const { query } = require('./database');

async function initializeDatabase() {
  try {
    console.log('Checking if database is initialized...');
    
    try {
      const result = await query(`SELECT USER FROM mysql.user WHERE USER = 'twitter_user'`);
      if (result.length > 0) {
        console.log('Database user already exists');
        return true;
      }
    } catch (e) {

    }

    console.log('Initializing database...');
    
    await query(`CREATE DATABASE IF NOT EXISTS twitter_clone`);
    await query(`CREATE USER IF NOT EXISTS 'twitter_user'@'%' IDENTIFIED BY 'twitter_password'`);
    await query(`GRANT ALL PRIVILEGES ON twitter_clone.* TO 'twitter_user'@'%'`);
    await query(`FLUSH PRIVILEGES`);
    
    console.log('Database and user created');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error.message);
    return false;
  }
}

module.exports = { initializeDatabase };
