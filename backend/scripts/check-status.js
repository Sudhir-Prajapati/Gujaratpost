const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    await conn.query("SET GLOBAL read_only = OFF;");
    console.log("Successfully set read_only = OFF!");
  } catch (err) {
    console.log("Error setting read_only:", err.message);
  }

  const [ro] = await conn.query("SHOW VARIABLES LIKE 'read_only'");
  console.log("Current read_only:", ro);

  await conn.end();
}

check().catch(console.error);
