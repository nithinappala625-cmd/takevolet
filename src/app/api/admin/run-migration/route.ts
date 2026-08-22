import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export async function POST() {
  try {
    const sqlPath = path.join(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'brain', '47af6b2f-dd5a-42aa-9669-cfdcc79ee359', 'CREATE_BUILD_CATEGORIES.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    for (let stmt of statements) {
      await prisma.$executeRawUnsafe(stmt);
    }
    
    return NextResponse.json({ success: true, message: 'Migration executed successfully' });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
