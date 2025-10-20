const mysql = require('mysql2');

async function initializeDatabase() {
  try {
    console.log('Checking if database is initialized...');
    
    const rootPool = mysql.createPool({
      host: process.env.DB_HOST || 'mysql',
      port: process.env.DB_PORT || 3306,
      user: 'root',
      password: process.env.MYSQL_ROOT_PASSWORD || 'rootpassword',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0
    });

    const promisePool = rootPool.promise();
    
    try {
      await promisePool.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'twitter_clone'}`);
      console.log('Database created');
    } catch (e) {
      console.log('Database already exists');
    }
    
    try {
      const user = process.env.DB_USER || 'twitter_user';
      const password = process.env.DB_PASSWORD || 'twitter_password';
      await promisePool.query(`CREATE USER IF NOT EXISTS '${user}'@'%' IDENTIFIED BY '${password}'`);
      console.log('User created');
    } catch (e) {
      console.log('User already exists');
    }
    
    try {
      const user = process.env.DB_USER || 'twitter_user';
      const dbName = process.env.DB_NAME || 'twitter_clone';
      await promisePool.query(`GRANT ALL PRIVILEGES ON ${dbName}.* TO '${user}'@'%'`);
      await promisePool.query(`FLUSH PRIVILEGES`);
      console.log('Privileges granted');
    } catch (e) {
      console.log('Privileges grant failed:', e.message);
    }

    rootPool.end();
    console.log('Database initialization complete');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error.message);
    return false;
  }
}

module.exports = { initializeDatabase };
