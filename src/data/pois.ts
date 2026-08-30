import { landmarksData } from './landmarks';

export interface POIItem {
  id: number;
  name: string;
  type: string;
  lat: number;
  lng: number;
  icon: string;
}

export const poiData: POIItem[] = landmarksData.map((item, idx) => {
  let type = 'university';
  let icon = '🎓';

  if (item.category === 'food') { type = 'food'; icon = '🍽️'; }
  else if (item.category === 'cafe' || item.category === 'Cafe') { type = 'cafe'; icon = '☕'; }
  else if (item.category === 'market') { type = 'market'; icon = '🛒'; }
  else if (item.category === 'hangout') { type = 'cafe'; icon = '🍻'; }
  else if (item.category === 'store') { type = 'market'; icon = '🏪'; }
  else if (item.category === 'gas') { type = 'university'; icon = '⛽'; }
  else if (item.category === 'hospital') { type = 'hospital'; icon = '🏥'; }
  else if (item.category === 'official place') { type = 'official'; icon = '🏛️'; }
  else if (item.category === 'Park' || item.category === 'park') { type = 'park'; icon = '🌳'; }
  else if (item.category === 'Stadium' || item.category === 'stadium') { type = 'stadium'; icon = '⚽'; }
  else if (item.category === 'Bank' || item.category === 'bank') { type = 'bank'; icon = '💵'; }

  return {
    id: idx + 1,
    name: item.name,
    type,
    lat: item.lat,
    lng: item.lng,
    icon,
  };
});

export const getPOITypeLabel = (type: string) => {
  switch (type) {
    case 'market':
      return 'ตลาด / แหล่งช้อปปิ้ง';
    case 'cafe':
      return 'คาเฟ่ / ร้านกาแฟ';
    case 'food':
      return 'ศูนย์อาหาร / ร้านอาหาร';
    case 'park':
      return 'สวนสาธารณะ / พักผ่อน';
    case 'university':
      return 'สถาบันการศึกษา / จุดสำคัญ';
    case 'hospital':
      return 'สุขภาพ / โรงพยาบาล';
    case 'official':
      return 'สถานที่ราชการ / บริการสาธารณะ';
    case 'stadium':
      return 'สนามกีฬา / ศูนย์กีฬา';
    case 'bank':
      return 'ธนาคาร / การเงิน';
    default:
      return 'สถานที่สำคัญ';
  }
};

export const getPOITypeColor = (type: string) => {
  switch (type) {
    case 'market':
      return '#E11D48'; // Rose red
    case 'cafe':
      return '#D97706'; // Warm amber
    case 'food':
      return '#EA580C'; // Orange
    case 'park':
      return '#059669'; // Emerald green
    case 'university':
      return '#2563EB'; // Royal blue
    case 'hospital':
      return '#0284C7'; // Sky blue
    case 'official':
      return '#4F46E5'; // Indigo
    case 'stadium':
      return '#EA580C'; // Orange
    case 'bank':
      return '#0284C7'; // Sky blue
    default:
      return '#64748B'; // Slate
  }
};
