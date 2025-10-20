const mysql = require('mysql2');

async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_USER:', process.env.DB_USER);
    
    const rootPassword = process.env.MYSQL_ROOT_PASSWORD || process.env.MYSQL_PASSWORD || 'rootpassword';
    console.log('Attempting connection with root password length:', rootPassword.length);
    
    const rootPool = mysql.createPool({
      host: process.env.DB_HOST || 'mysql',
      port: process.env.DB_PORT || 3306,
      user: 'root',
      password: rootPassword,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0
    });

    const promisePool = rootPool.promise();
    
    console.log('Attempting to connect to MySQL as root...');
    const [result] = await promisePool.query('SELECT 1');
    console.log('Successfully connected to MySQL as root');
    
    try {
      const dbName = process.env.DB_NAME || 'twitter_clone';
      await promisePool.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
      console.log('Database created/verified:', dbName);
    } catch (e) {
      console.log('Database operation note:', e.message);
    }
    
    try {
      const user = process.env.DB_USER || 'twitter_user';
      const password = process.env.DB_PASSWORD || 'twitter_password';
      await promisePool.query(`CREATE USER IF NOT EXISTS '${user}'@'%' IDENTIFIED BY '${password}'`);
      console.log('User created/verified:', user);
    } catch (e) {
      console.log('User operation note:', e.message);
    }
    
    try {
      const user = process.env.DB_USER || 'twitter_user';
      const dbName = process.env.DB_NAME || 'twitter_clone';
      await promisePool.query(`GRANT ALL PRIVILEGES ON ${dbName}.* TO '${user}'@'%'`);
      await promisePool.query(`FLUSH PRIVILEGES`);
      console.log('Privileges granted to:', user);
    } catch (e) {
      console.log('Privileges operation note:', e.message);
    }

    await rootPool.end();
    console.log('Database initialization complete');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    return false;
  }
}

module.exports = { initializeDatabase };
