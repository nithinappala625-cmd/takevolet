const { Client } = require('pg');
const fs = require('fs');

async function main() {
  // Extract database URL from .env
  const envFile = fs.readFileSync('.env', 'utf8');
  let dbUrl = '';
  const match = envFile.match(/DATABASE_URL="([^"]+)"/);
  if (match) dbUrl = match[1];
  else {
    const match2 = envFile.match(/DATABASE_URL=([^\s]+)/);
    if (match2) dbUrl = match2[1];
  }

  if (!dbUrl) throw new Error("Could not find DATABASE_URL in .env");

  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  
  const sqlPath = 'C:\\Users\\Appala nithin\\.gemini\\antigravity\\brain\\47af6b2f-dd5a-42aa-9669-cfdcc79ee359\\CREATE_BUILD_CATEGORIES.sql';
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  
  for (let stmt of statements) {
    console.log("Executing statement...");
    await client.query(stmt);
  }
  
  await client.end();
  console.log("Migration complete!");
}
main().catch(console.error);
