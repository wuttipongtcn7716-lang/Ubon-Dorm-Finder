export interface LandmarkItem {
  id?: string | number;
  name: string;
  lat: number;
  lng: number;
  category: 'food' | 'shabu' | 'streetfood' | 'cafe' | 'store' | 'faculty' | 'hospital' | 'building' | 'landmark' | 'service' | 'hangout' | 'market' | 'gas' | 'official place' | string;
}

export const landmarksData: LandmarkItem[] = [
  // สถานีใน ม.อุบล (อาคารเรียนรวม & คณะ)
  { name: "โรงอาหารกลาง ๑", lat: 15.119555, lng: 104.905864, category: "food" },
  { name: "โรงอาหารกลาง ๒ (ม.อุบลฯ)", lat: 15.119374, lng: 104.906403, category: "food" },
  { name: "ศูนย์อาหารหอใน (FOOD CENTER)", lat: 15.131921, lng: 104.908099, category: "food" },
  { name: "คณะบริหารศาสตร์", lat: 15.119319, lng: 104.903491, category: "building" },
  { name: "คณะบริหารศาสตร์ (หลังใหม่)", lat: 15.119319, lng: 104.903491, category: "building" },
  { name: "คณะวิศวกรรมศาสตร์", lat: 15.119938, lng: 104.904966, category: "building" },
  { name: "คณะนิติศาสตร์ CLB2", lat: 15.120262, lng: 104.905980, category: "building" },
  { name: "คณะรัฐศาสตร์", lat: 15.120413, lng: 104.910188, category: "building" },
  { name: "คณะวิทยาศาสตร์", lat: 15.122469, lng: 104.906575, category: "building" },
  { name: "คณะเกษตรศาสตร์", lat: 15.121958, lng: 104.908394, category: "building" },
  { name: "คณะเภสัชศาสตร์ (หลังเดิม)", lat: 15.119446, lng: 104.910950, category: "building" },
  { name: "คณะเภสัชศาสตร์ (หลังใหม่)", lat: 15.120446, lng: 104.910888, category: "building" },
  { name: "คณะศิลปประยุกต์และสถาปัตยกรรมศาสตร์", lat: 15.118228, lng: 104.905647, category: "building" },
  { name: "คณะศิลปศาสตร์", lat: 15.116815, lng: 104.908793, category: "building" },
  { name: "คณะพยาบาลศาสตร์", lat: 15.115246, lng: 104.906468, category: "building" },
  { name: "วิทยาลัยแพทยศาสตร์และการสาธารณสุข", lat: 15.115360, lng: 104.905213, category: "building" },
  { name: "อาคารเรียนรวม 3 (CLB3)", lat: 15.117810, lng: 104.907578, category: "building" },
  { name: "อาคารเรียนรวม 4 (CLB4)", lat: 15.120793, lng: 104.908469, category: "building" },
  { name: "อาคารเรียนรวม 5 (CLB5)", lat: 15.120244, lng: 104.909043, category: "building" },

  // จุดสำคัญ / สถานที่ใน ม.
  { name: "อาคารเฉลิมพระเกียรติ 7 รอบพระชนมพรรษาฯ", lat: 15.114791, lng: 104.901412, category: "landmark" },
  { name: "หอสมุดกลาง (ODL)", lat: 15.118783, lng: 104.907804, category: "landmark" },
  { name: "สำนักงานอธิการบดี", lat: 15.117253, lng: 104.903069, category: "landmark" },
  { name: "สำนักคอมพิวเตอร์และเครือข่าย มหาวิทยาลัยอุบลราชธานี", lat: 15.120090, lng: 104.907353, category: "landmark" },
  { name: "โรงพยาบาลมหาวิทยาลัยอุบลราชธานี", lat: 15.113859, lng: 104.903260, category: "hospital" },

  // ปั๊มน้ำมัน
  { name: "ปั๊ม ปตท. หน้า ม.อุบลฯ", lat: 15.112752, lng: 104.900948, category: "gas" },
  { name: "ปั้มน้ำมันPT", lat: 15.133483, lng: 104.895884, category: "gas" },

  // ร้านอาหาร
  { name: "ครัวพนิตา", lat: 15.112426, lng: 104.902072, category: "food" },
  { name: "ร้านก๋วยจั๊บบัวเขียว", lat: 15.112913, lng: 104.903595, category: "food" },
  { name: "ก๋วยเตี๋ยวเรือ ป.ประทีป (ทางไปประตู 3)", lat: 15.112999, lng: 104.903834, category: "food" },
  { name: "อร่อยใกล้ฉัน ณ ประตู 3", lat: 15.114195, lng: 104.906755, category: "food" },
  { name: "ศูนย์อาหารมีเจริญ", lat: 15.120342, lng: 104.898810, category: "food" },
  { name: "ซุปตาร์ ชาบู ม.อุบล", lat: 15.119439, lng: 104.899663, category: "food" },
  { name: "อิสานอินดี้ K&J", lat: 15.110873, lng: 104.910574, category: "food" },
  { name: "เจริญลาบ ม.อุบลฯ", lat: 15.109774, lng: 104.9000465, category: "food" },

  // คาเฟ่
  { name: "NAM NOM", lat: 15.112266, lng: 104.901549, category: "cafe" },
  { name: "นมละมุน (Nom la Moon)", lat: 15.112600, lng: 104.895787, category: "cafe" },
  { name: "คาเฟ่ อเมซอน สาขา ปตท. มหาวิทยาลัยอุบลราชธานี", lat: 15.112514, lng: 104.901288, category: "cafe" },

  // ตลาด
  { name: "ตลาดบังเอิญ", lat: 15.116176, lng: 104.898075, category: "market" },
  { name: "ตลาดนัด ม.อุบลฯ (หน้าประตู 1)", lat: 15.119234, lng: 104.900967, category: "market" },

  // Hangout
  { name: "Duck cafe", lat: 15.125086, lng: 104.897898, category: "hangout" },
  { name: "OPEN BAR", lat: 15.124244, lng: 104.898520, category: "hangout" },
  { name: "Lang Ban Camp", lat: 15.113030, lng: 104.911851, category: "hangout" },

  // ร้านสะดวกซื้อ / Store
  { name: "7-Eleven สาขา หน้า ม.อุบล 2", lat: 15.116443, lng: 104.899542, category: "store" },
  { name: "7-Eleven สาขา PTTOR ม.อุบล (07074)", lat: 15.112535, lng: 104.900948, category: "store" },
  { name: "โลตัส โกเฟรช ม.อุบลฯ", lat: 15.120265, lng: 104.899220, category: "store" },
  { name: "Big C mini ชุมชนศรีไค", lat: 15.108641, lng: 104.904244, category: "store" },

  // สุขภาพ/คลินิก/รพ.
  { name: "โรงพยาบาลส่งเสริมสุขภาพตำบลเมืองศรีไค", lat: 15.111414, lng: 104.900119, category: "hospital" },

  // สถานที่ราชการ (หมวดหมู่ใหม่)
  { name: "เคาน์เตอร์ไปรษณีย์ สาขาเมืองศรีไค", lat: 15.112173, lng: 104.900438, category: "official place" },
  { name: "สถานีตำรวจภูธรย่อย เทศบาลตำบลเมืองศรีไค", lat: 15.116160, lng: 104.899548, category: "official place" },
  { name: "โรงพยาบาลส่งเสริมสุขภาพตำบลบัววัด", lat: 15.128640, lng: 104.897745, category: "official place" },
  { name: "ศูนย์อนามัยที่ 10 อุบลราชธานี", lat: 15.127623, lng: 104.896865, category: "official place" },
  { name: "สำนักงานเทศบาลตำบลธาตุ", lat: 15.128156, lng: 104.897662, category: "official place" },
  { name: "สำนักงานเทศบาลตำบลเมืองศรีไค", lat: 15.115886, lng: 104.899572, category: "official place" },
  { name: "องค์การบริหารส่วนตำบลโพธิ์ใหญ่", lat: 15.120420, lng: 104.936900, category: "official place" },

  // สวนสาธารณะ (Park)
  { name: "สวนสาธารณะ (หนองอีเจม)", lat: 15.128649, lng: 104.911567, category: "Park" },
  { name: "ทุ่งหญ้าลานหมาแมว", lat: 15.126235, lng: 104.915526, category: "Park" },

  // คาเฟ่เพิ่มเติม (Cafe)
  { name: "เฮือนกำนันคาเฟ่ (Huankamnan Cafe)", lat: 15.122857, lng: 104.913619, category: "Cafe" },
  { name: "Blue Cabin Coffee", lat: 15.117867, lng: 104.916381, category: "Cafe" },
  { name: "GOLDEN HOUR COFFEE", lat: 15.117062, lng: 104.912894, category: "Cafe" },
  { name: "Inthanin Coffee - มหาวิทยาลัยอุบลราชธานี", lat: 15.120174, lng: 104.911261, category: "Cafe" },

  // สนามกีฬา / ฟิตเนส (Stadium)
  { name: "สนามกีฬากลาง (มหาวิทยาลัยอุบลราชธานี)", lat: 15.126596, lng: 104.917202, category: "stadium" },
  { name: "โรงพละศึกษาอเนกประสงค์ (มหาวิทยาลัยอุบลราชธานี)", lat: 15.128172, lng: 104.916537, category: "stadium" },
  { name: "ศูนย์กีฬาอเนกประสงค์ (มหาวิทยาลัยอุบลราชธานี)", lat: 15.128077, lng: 104.914734, category: "stadium" },
  { name: "สระว่ายน้ำยอดเศรณี (มหาวิทยาลัยอุบลราชธานี)", lat: 15.126979, lng: 104.914863, category: "stadium" },

  // ธนาคาร (Bank)
  { name: "ธนาคารไทยพาณิชย์ (สาขามหาวิทยาลัยอุบลราชธานี)", lat: 15.117302, lng: 104.902729, category: "Bank" },

  // ร้านอาหาร (เพิ่มเติม)
  { name: "กลมกรอบ - ข้าวไก่ทอด Fried Chicken 炸鸡饭 (สาขา หน้า ม.อุบล)", lat: 15.119063, lng: 104.898842, category: "food" },
  { name: "ร้านผลไม้ริมทาง24", lat: 15.139689, lng: 104.894725, category: "food" }
];

export type LandmarkGroup =
  | 'none'
  | 'all'
  | 'building'
  | 'landmark'
  | 'stadium'
  | 'gas'
  | 'official'
  | 'food'
  | 'shabu'
  | 'streetfood'
  | 'cafe'
  | 'store'
  | 'faculty'
  | 'service'
  | 'hospital'
  | 'hangout'
  | 'park'
  | 'bank';

export const MAIN_CATEGORIES: { id: LandmarkGroup; label: string; icon: string }[] = [
  { id: 'none', label: 'ซ่อนสถานที่รอบข้าง', icon: '🚫' },
  { id: 'all', label: 'แสดงทุกหมวดหมู่', icon: '📍' },
  { id: 'building', label: 'อาคารเรียนรวม', icon: '🏫' },
  { id: 'landmark', label: 'จุดสำคัญ / สถานที่ใน ม.', icon: '🏛️' },
  { id: 'stadium', label: 'สนามกีฬา / ฟิตเนส', icon: '⚽' },
  { id: 'gas', label: 'ปั๊มน้ำมัน', icon: '⛽' },
  { id: 'official', label: 'สถานที่ราชการ / บริการสาธารณะ', icon: '🏢' },
  { id: 'food', label: 'ร้านอาหาร / โรงอาหาร', icon: '🍜' },
  { id: 'streetfood', label: 'ของกินเล่น / ตลาด', icon: '🍢' },
  { id: 'cafe', label: 'คาเฟ่ / กาแฟ', icon: '☕' },
  { id: 'store', label: 'ร้านสะดวกซื้อ / มินิมาร์ท', icon: '🏪' },
  { id: 'hospital', label: 'สุขภาพ / คลินิก / รพ.', icon: '🏥' },
  { id: 'hangout', label: 'แฮงค์เอาท์ / บาร์', icon: '🍻' },
  { id: 'park', label: 'สวนสาธารณะ / พักผ่อน', icon: '🌳' },
  { id: 'bank', label: 'ธนาคาร / การเงิน', icon: '💵' },
];

export const getLandmarkMeta = (category: string, name?: string) => {
  // 1. Strict Gas Trap: Gas stations always stay in 'gas', never leak into building or landmark
  if (category === 'gas' || (name && (name.includes('ปั๊ม') || name.includes('ปั้ม')))) {
    return { icon: '⛽', label: 'ปั๊มน้ำมัน / สถานีบริการ', color: '#059669', group: 'gas' };
  }

  // 2. Strict Sports Trap: Sports facilities always stay in 'stadium', never leak into landmark or building
  if (category === 'stadium' || category === 'Stadium' || (name && (name.includes('กีฬา') || name.includes('พละ') || name.includes('สระว่ายน้ำ') || name.includes('ฟิตเนส')))) {
    return { icon: '⚽', label: 'สนามกีฬา / ฟิตเนส', color: '#EA580C', group: 'stadium' };
  }

  // 3. Campus Gates
  if (name && (name.startsWith('ประตู') || name.includes('ประตู ม.'))) {
    return { icon: '🏛️', label: 'ประตู ม.อุบลฯ', color: '#4F46E5', group: 'landmark' };
  }

  // 4. ATMs
  const isAtm = name && (name.startsWith('ATM') || name.startsWith('เอทีเอ็ม') || name.includes('ATM'));
  if (isAtm) {
    return { icon: '🏧', label: 'ตู้ ATM / การเงิน', color: '#0284C7', group: 'bank' };
  }

  // 5. Internet Games
  const isGame = name && name.includes('Internet&Games');
  if (isGame) {
    return { icon: '🎮', label: 'ร้านอินเทอร์เน็ต / เกม', color: '#6366F1', group: 'service' };
  }

  // 6. Special Landmarks inside University
  if (name) {
    if (name.includes('หอสมุด')) {
      return { icon: '📚', label: 'หอสมุดกลาง ม.อุบลฯ', color: '#2563EB', group: 'landmark' };
    }
    if (name.includes('สำนักงานอธิการบดี')) {
      return { icon: '🏛️', label: 'สำนักงานอธิการบดี', color: '#2563EB', group: 'landmark' };
    }
    if (name.includes('สำนักคอมพิวเตอร์')) {
      return { icon: '💻', label: 'สำนักคอมพิวเตอร์และเครือข่าย', color: '#2563EB', group: 'landmark' };
    }
    if (name.includes('เฉลิมพระเกียรติ')) {
      return { icon: '🏛️', label: 'หอประชุม / ศูนย์ประชุม', color: '#2563EB', group: 'landmark' };
    }
  }

  switch (category) {
    case 'building':
      return { icon: '🏫', label: 'อาคารเรียนรวม / บรรยาย', color: '#4F46E5', group: 'building' };
    case 'faculty':
      return { icon: '🎓', label: 'คณะ / อาคารเรียน', color: '#4F46E5', group: 'building' };
    case 'landmark':
      return { icon: '🏛️', label: 'จุดสำคัญ / สถานที่ใน ม.', color: '#2563EB', group: 'landmark' };
    case 'gas':
      return { icon: '⛽', label: 'ปั๊มน้ำมัน / สถานีบริการ', color: '#059669', group: 'gas' };
    case 'food':
      return { icon: '🍜', label: 'ร้านอาหาร / โรงอาหาร', color: '#EA580C', group: 'food' };
    case 'shabu':
      return { icon: '🍲', label: 'ชาบู / หมูกระทะ / ปิ้งย่าง', color: '#DC2626', group: 'shabu' };
    case 'streetfood':
      return { icon: '🍢', label: 'ของกินเล่น / สตรีทฟู้ด / ตลาด', color: '#E11D48', group: 'streetfood' };
    case 'cafe':
    case 'Cafe':
      return { icon: '☕', label: 'คาเฟ่ / กาแฟ / ขนมหวาน', color: '#D97706', group: 'cafe' };
    case 'store':
      return { icon: '🏪', label: 'ร้านสะดวกซื้อ / มินิมาร์ท / ชุมชน', color: '#059669', group: 'store' };
    case 'service':
      return { icon: '✂️', label: 'บริการ / ซักอบ / เสริมสวย / ถ่ายเอกสาร', color: '#8B5CF6', group: 'service' };
    case 'hangout':
      return { icon: '🍻', label: 'แฮงค์เอาท์ / บาร์ / ดนตรี', color: '#EC4899', group: 'hangout' };
    case 'hospital':
      return { icon: '🏥', label: 'สุขภาพ / คลินิก / รพ.สต. / ร้านยา', color: '#0284C7', group: 'hospital' };
    case 'market':
      return { icon: '🛒', label: 'ตลาด / แหล่งช้อปปิ้ง', color: '#E11D48', group: 'streetfood' };
    case 'official place':
      return { icon: '🏢', label: 'สถานที่ราชการ / บริการสาธารณะ', color: '#4F46E5', group: 'official' };
    case 'Park':
    case 'park':
      return { icon: '🌳', label: 'สวนสาธารณะ / พักผ่อน', color: '#16A34A', group: 'park' };
    case 'Stadium':
    case 'stadium':
      return { icon: '⚽', label: 'สนามกีฬา / ฟิตเนส', color: '#EA580C', group: 'stadium' };
    case 'Bank':
    case 'bank':
      return { icon: '💵', label: 'ธนาคาร / การเงิน', color: '#0284C7', group: 'bank' };
    default:
      return { icon: '📍', label: 'สถานที่สำคัญ', color: '#64748B', group: 'landmark' };
  }
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatLandmarkDistance(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000 / 10) * 10;
    return meters + ' ม.';
  }
  return km.toFixed(1) + ' กม.';
}

export function getNearbyLandmarks(dormLat: number, dormLng: number, limit = 6) {
  if (!dormLat || !dormLng) return [];

  return landmarksData
    .map((item) => {
      const distKm = haversineDistance(dormLat, dormLng, item.lat, item.lng);
      const meta = getLandmarkMeta(item.category, item.name);
      return {
        ...item,
        distKm,
        distFormatted: formatLandmarkDistance(distKm),
        meta,
      };
    })
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, limit);
}
