import { NextResponse } from 'next/server';
import dormsData from '@/data/dorms.json';
import { Dormitory } from '@/types/dormitory';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase().trim() || '';
  const zone = searchParams.get('zone') || '';
  const whiteOnly = searchParams.get('whiteOnly') === 'true';
  const roomType = searchParams.get('roomType') || '';
  const genderType = searchParams.get('genderType') || '';
  const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null;
  const pet = searchParams.get('pet') === 'true';
  const noFlood = searchParams.get('noFlood') === 'true';

  let filtered: Dormitory[] = dormsData as Dormitory[];

  if (search) {
    filtered = filtered.filter(d => 
      (d.name || '').toLowerCase().includes(search) || 
      (d.zone || '').toLowerCase().includes(search) ||
      (d.remarks || '').toLowerCase().includes(search) ||
      (d.phone || '').includes(search) ||
      (d.type || '').toLowerCase().includes(search) ||
      (d.roomType || '').toLowerCase().includes(search)
    );
  }

  if (zone && zone !== 'all') {
    filtered = filtered.filter(d => (d.zone || '').includes(zone));
  }

  if (whiteOnly) {
    filtered = filtered.filter(d => Boolean(d.isWhiteDorm || d.status === 'ผ่าน' || d.evalResult === 'ผ่าน'));
  }

  if (roomType && roomType !== 'all') {
    if (roomType === 'air') {
      filtered = filtered.filter(d => 
        (d.roomType || d.type || '').includes('แอร์')
      );
    }
    if (roomType === 'fan') {
      filtered = filtered.filter(d => 
        (d.roomType || d.type || '').includes('พัดลม')
      );
    }
  }

  if (genderType && genderType !== 'all') {
    filtered = filtered.filter(d => {
      const raw = (d.genderType || '').trim();
      let mapped = 'mixed';
      if (raw === 'หอหญิง' || raw === 'หอพักหญิง' || raw === 'female') {
        mapped = 'female';
      } else if (raw === 'หอชาย' || raw === 'หอพักชาย' || raw === 'male') {
        mapped = 'male';
      } else if (raw === 'หอพักรวม' || raw === 'mixed') {
        mapped = 'mixed';
      }
      return mapped === genderType;
    });
  }

  if (maxPrice) {
    filtered = filtered.filter(d => (d.minPrice || 0) <= maxPrice);
  }

  if (pet) {
    filtered = filtered.filter(d => Boolean(d.allowPet));
  }

  if (noFlood) {
    filtered = filtered.filter(d => !d.floodRisk);
  }

  return NextResponse.json({
    total: filtered.length,
    data: filtered,
  });
}
