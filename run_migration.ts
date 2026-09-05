import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  try {
    const sqlPath = path.join(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'brain', '47af6b2f-dd5a-42aa-9669-cfdcc79ee359', 'CREATE_BUILD_CATEGORIES.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running SQL...');
    
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    for (let stmt of statements) {
      console.log('Executing:', stmt.substring(0, 50) + '...');
      await prisma.$executeRawUnsafe(stmt);
    }
    
    console.log('Successfully executed SQL!');
  } catch (e) {
    console.error('Error running SQL:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
