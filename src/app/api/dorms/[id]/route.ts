import { NextResponse } from 'next/server';
import dormsData from '@/data/dorms.json';
import { Dormitory } from '@/types/dormitory';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  const dorm = (dormsData as Dormitory[]).find(d => d.id === id);

  if (!dorm) {
    return NextResponse.json({ error: 'ไม่พบข้อมูลหอพัก' }, { status: 404 });
  }

  return NextResponse.json(dorm);
}
