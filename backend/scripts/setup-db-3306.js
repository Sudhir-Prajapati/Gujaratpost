const mysql = require('mysql2/promise');

async function setup() {
  console.log('Setting up gujaratpost database on 3306...');
  
  // Connect as root to do admin tasks
  const root = await mysql.createConnection('mysql://root:root@123@127.0.0.1:3306/');
  
  // Create database
  await root.query('CREATE DATABASE IF NOT EXISTS gujaratpost CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  console.log('✓ Database created: gujaratpost');
  
  // Create user if not exists
  try {
    await root.query("CREATE USER IF NOT EXISTS 'gujaratpost'@'localhost' IDENTIFIED BY 'gujaratpost2005'");
    await root.query("CREATE USER IF NOT EXISTS 'gujaratpost'@'127.0.0.1' IDENTIFIED BY 'gujaratpost2005'");
    await root.query("CREATE USER IF NOT EXISTS 'gujaratpost'@'%' IDENTIFIED BY 'gujaratpost2005'");
    console.log('✓ User created: gujaratpost');
  } catch (e) {
    console.log('  User may already exist:', e.message);
  }
  
  // Grant all privileges
  await root.query("GRANT ALL PRIVILEGES ON `gujaratpost`.* TO 'gujaratpost'@'localhost'");
  await root.query("GRANT ALL PRIVILEGES ON `gujaratpost`.* TO 'gujaratpost'@'127.0.0.1'");
  await root.query("GRANT ALL PRIVILEGES ON `gujaratpost`.* TO 'gujaratpost'@'%'");
  await root.query("FLUSH PRIVILEGES");
  console.log('✓ Privileges granted to gujaratpost user');
  
  await root.end();
  
  // Test connection as gujaratpost user
  const testConn = await mysql.createConnection('mysql://gujaratpost:gujaratpost2005@127.0.0.1:3306/gujaratpost');
  console.log('✓ gujaratpost user can connect to gujaratpost db on 3306!');
  await testConn.end();
  
  console.log('\nNow update DATABASE_URL in .env to use port 3306.');
}

setup().catch(console.error);
