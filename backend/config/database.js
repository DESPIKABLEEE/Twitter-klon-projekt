const mysql = require('mysql2');

console.log('Database config:');
console.log('DB_HOST:', process.env.DB_HOST || 'mysql');
console.log('DB_PORT:', process.env.DB_PORT || 3306);
console.log('DB_NAME:', process.env.DB_NAME || 'railway');
console.log('DB_USER:', process.env.DB_USER || 'root');
console.log('DB_PASSWORD length:', (process.env.DB_PASSWORD || 'twitter_password').length);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'twitter_password',
  database: process.env.DB_NAME || 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00'
});


const promisePool = pool.promise();


const testConnection = async () => {
  try {
    console.log('Testing database connection...');
    const connection = await promisePool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    
    setTimeout(testConnection, 5000);
  }
};

testConnection();

const query = async (sql, params = []) => {
  try {
    const [rows] = await promisePool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

const transaction = async (callback) => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  promisePool,
  query,
  transaction
};