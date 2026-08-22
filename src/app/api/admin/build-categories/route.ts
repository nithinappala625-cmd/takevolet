import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const data = await prisma.$queryRaw`SELECT * FROM public.build_categories ORDER BY created_at DESC`;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { main_category, sub_category, icon_name } = await req.json();
    await prisma.$executeRawUnsafe(
      `INSERT INTO public.build_categories (main_category, sub_category, icon_name) VALUES ($1, $2, $3)`,
      main_category, sub_category, icon_name || 'category'
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
