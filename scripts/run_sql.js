const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const sqlPath = 'C:\\Users\\Appala nithin\\.gemini\\antigravity\\brain\\47af6b2f-dd5a-42aa-9669-cfdcc79ee359\\CREATE_BUILD_CATEGORIES.sql';
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  
  for (let stmt of statements) {
    console.log("Executing:", stmt.substring(0, 50) + "...");
    await prisma.$executeRawUnsafe(stmt);
  }
  console.log("Done");
}

main().catch(console.error).finally(() => prisma.$disconnect());
