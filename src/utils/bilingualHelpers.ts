/**
 * Utility functions for formatting and translating dormitory information
 * between Thai (TH) and English (EN).
 */

export const DORM_ENGLISH_NAMES: Record<number, string> = {
  1: 'Chomdao Dormitory 1',
  2: 'Chomdao Dormitory 2',
  3: 'Bua Khiao Dormitory',
  4: 'Bua Luang Dormitory',
  5: 'Boss Residence',
  6: 'Top One Dormitory',
  7: 'Chaisanguan Mansion',
  8: 'Phimlaphat Dormitory',
  9: 'Golden Shan Dormitory',
  10: 'Sukhsiri Mansion',
  11: 'Rakdee Place 1',
  12: 'Rakdee Place 2',
  13: 'Khemchat Dormitory',
  14: 'Khwanruedee Dormitory',
  15: 'Pheeranuch Place',
  16: 'Phorn-anan Dormitory',
  17: 'Sukruthai Dormitory',
  18: 'Homie Place',
  19: 'Phorntip Dormitory',
  20: 'Phongphorn 1',
  21: 'Phongphorn 2',
  22: 'Samaphorn Dormitory',
  23: 'Suan Khun Ya Luley (LULEY HO)',
  24: 'Baitang Mansion',
  25: 'Bandit Dormitory',
  26: 'Chomchan Loft',
  27: 'Ivory Dormitory',
  28: 'Bandit Mansion',
  29: 'Sawasdee Apartment',
  30: 'Wanason Dormitory',
  31: 'Thararat Female Dormitory',
  32: 'Dokmai Place',
  33: 'Santisuk Mansion',
  34: 'Panitrawee Dormitory',
  35: 'Katesiri Dormitory',
  36: 'Deejing Mansion 1',
  37: 'Deejing Mansion 2',
  38: 'Deejing Mansion 3',
  39: 'Phaendin Thong Dormitory',
  40: 'Kotchaporn Female Dormitory',
  41: 'Siri Place',
  42: 'Phee Nong Dormitory',
  43: 'Suksamer Mansion',
  44: 'Rosnee Dormitory',
  45: 'Siriphan Dormitory',
  46: 'Jatuphon Dormitory',
  47: 'Mayuree Mansion',
  48: 'Nattinee Apartment (Baan Farang)',
  49: 'Phitsamai Dormitory',
  50: 'Phimcharoen Dormitory',
  51: 'Ruan Chao Jom Dormitory',
  52: 'Phimsiri Apartment',
  53: 'Thaweechai Mansion',
  54: 'Weeraphorn Female Dormitory',
  55: 'Weeraphorn Female Dormitory 1',
  56: 'Weeraphorn Female Dormitory 2',
  57: 'Pornkamon Dormitory',
  58: 'Green Home Dormitory',
  59: 'Dokmai Hom Dormitory',
  60: 'Rim Mor Mansion',
};

export function getDormName(dorm: { id: number; name?: string } | undefined | null, isEn: boolean): string {
  if (!dorm) return '';
  if (isEn && DORM_ENGLISH_NAMES[dorm.id]) {
    return DORM_ENGLISH_NAMES[dorm.id];
  }
  return dorm.name || '';
}

export function translateDormExpense(val: string, isEn: boolean): string {
  if (!isEn || !val) return val;
  let s = val.trim();

  if (s === 'ไม่มีข้อมูล') return 'No information';

  // Note translation
  if (s.includes('หมายเหตุ: ค่าใช้จ่ายอาจมีการเปลี่ยนแปลง')) {
    return 'Note: Expenses may be subject to change. Please contact the dormitory to confirm rates and terms prior to signing a contract.';
  }

  // Special dorm 60 rent price: "พัดลม 2,900 แอร์ 3,200 บาท/เดือน"
  if (s.includes('พัดลม') && s.includes('แอร์') && s.includes('บาท/เดือน')) {
    return s
      .replace('พัดลม', 'Fan')
      .replace('แอร์', 'Air')
      .replace('บาท/เดือน', 'THB/month');
  }

  // Rent price: "3,000 บาท/เดือน" -> "3,000 THB/month"
  if (s.includes('บาท/เดือน')) {
    return s.replace('บาท/เดือน', 'THB/month');
  }

  // Water rate:
  // "100 บาท/คน (เหมาจ่าย)" -> "100 THB/person (Flat Rate)"
  if (s.includes('บาท/คน (เหมาจ่าย)')) {
    return s.replace('บาท/คน (เหมาจ่าย)', 'THB/person (Flat Rate)');
  }
  // "150 บาท (เหมาจ่าย)" -> "150 THB (Flat Rate)"
  if (s.includes('บาท (เหมาจ่าย)')) {
    return s.replace('บาท (เหมาจ่าย)', 'THB (Flat Rate)');
  }
  // "20 บาท/หน่วย" -> "20 THB/unit"
  if (s.includes('บาท/หน่วย')) {
    return s.replace('บาท/หน่วย', 'THB/unit');
  }

  // Deposit: "3,000 บาท" -> "3,000 THB"
  if (s.endsWith('บาท')) {
    return s.replace(/บาท$/, 'THB');
  }

  // Minimum lease:
  if (s === 'ไม่ขั้นต่ำ') return 'No minimum';
  if (s === 'สิ้นทุกเดือนเมษายน') return 'Ends every April';
  if (s === '1 ปี') return '1 year';
  if (s.endsWith('เดือน')) {
    const months = s.replace(/[^\d]/g, '');
    return `${months} months`;
  }

  return s;
}

export function translateDormValue(val: string, isEn: boolean): string {
  if (!isEn || !val) return val;
  const s = val.trim();

  const MAP: Record<string, string> = {
    // Basic booleans / availability
    'มี': 'Available',
    'ไม่มี': 'Not available',
    'ได้': 'Allowed',
    'ไม่ได้': 'Not allowed',
    'ผ่าน': 'Passed',
    'ไม่ผ่าน': 'Failed',
    'ไม่มีข้อมูล': 'No information',

    // Flood risk status
    'ไม่เสี่ยง': 'No flood risk',
    'ไม่่เสี่ยง': 'No flood risk',
    'ไม่เสี่ี่ยง': 'No flood risk',
    'เสี่ยง': 'At risk',
    'เสี่ยงปานกลาง': 'Moderate risk',

    // Tenant / gender types
    'หอพักรวม': 'Mixed-gender',
    'หอพักหญิง': 'Female Only',
    'หอหญิง': 'Female Only',
    'หอพักชาย': 'Male Only',
    'หอชาย': 'Male Only',
    'mixed': 'Mixed-gender',
    'female': 'Female Only',
    'male': 'Male Only',

    // Room types
    'ห้องแอร์': 'Air-conditioned room',
    'ห้องพัดลม': 'Fan room',
    'ทั้งสอง': 'Both (Fan & Air)',
    'ห้องแอร์/ห้องพัดลม': 'Both (Air / Fan)',
    'ห้องพัดลม/ห้องแอร์': 'Both (Fan / Air)',
    'ห้องแอร์/พัดลม': 'Both (Air / Fan)',
    'พัดลม': 'Fan',
    'แอร์': 'Air-conditioned',

    // Environment & Surroundings
    'ในซอย': 'In alley / Soi',
    'ติดถนนใหญ่': 'On main road',
    'ใกล้ถนนใหญ่': 'Near main road',
    'อยู่ทางรอง': 'On secondary road',
    'อยู่ซอยรอง': 'In secondary alley',
    'อยู่หน้าม.': 'In front of campus',
    'ถนนสถลมาร์ค': 'Sathonlamark Rd.',
    'ถนนสกลมาร์ค': 'Sathonlamark Rd.',

    // Pub distance
    'ไกล': 'Far',
    'ใกล้': 'Near',
    'ใกล้้': 'Near',
    'ไม่ไกลมาก': 'Not far',
    'ใกล้ปานกลาง': 'Moderate distance',

    // Noise level
    'เงียบสงบ': 'Quiet',
    'เงียบ': 'Quiet',
    'ปานกลาง': 'Moderate',
    'พลุกพล่าน': 'Busy',
    'ดัง': 'Noisy',
    'ดััง': 'Noisy',

    // Gate closing time & hours
    'ไม่จำกัด': '24 Hours (No curfew)',
    'เปิด 24 ชม.': 'Open 24 Hours',
    '24 ชม.': '24 Hours',
    'ไม่มีเวลาปิด': 'No curfew',
  };

  if (MAP[s]) return MAP[s];

  // Distance translations if in Thai
  if (s.endsWith('กม.')) {
    return s.replace(/กม\.$/, 'km');
  }
  if (s.endsWith('ม.')) {
    return s.replace(/ม\.$/, 'm');
  }

  // Time format e.g. "05.00-22.00 น." -> "05:00 - 22:00"
  if (s.endsWith('น.')) {
    return s.replace(/\s*น\.$/, '');
  }

  return s;
}

export function translateNearbyPlaceName(name: string, isEn: boolean): string {
  if (!isEn || !name) return name;
  const s = name.trim();

  const EXACT_MAP: Record<string, string> = {
    'ตลาดบังเอิญ': 'Bang Euen Market',
    'ศูนย์อาหารมีเจริญ': 'Mee Charoen Food Center',
    'ร้านอาหารศูนย์อาหารมีเจริญ': 'Mee Charoen Food Center',
    'ก๋วยเตี๋ยวเรือ ป.ประทีป': 'P. Prateep Boat Noodles',
    'ร้านก๋วยเตี๋ยวเรือ ป.ประทีป': 'P. Prateep Boat Noodles',
    'ก๋วยเตี๋ยวเรือ ป.ประทีป (ทางไปประตู 3)': 'P. Prateep Boat Noodles (Gate 3 Way)',
    'โรงอาหารกลาง ๑': 'Central Canteen 1',
    'โรงอาหารกลาง ๒ (ม.อุบลฯ)': 'Central Canteen 2 (UBU)',
    'ศูนย์อาหารหอใน (FOOD CENTER)': 'Dormitory Food Center',
    'คณะบริหารศาสตร์': 'Faculty of Management Science',
    'คณะบริหารศาสตร์ (หลังใหม่)': 'Faculty of Management Science (New)',
    'คณะวิศวกรรมศาสตร์': 'Faculty of Engineering',
    'คณะนิติศาสตร์ CLB2': 'Faculty of Law (CLB2)',
    'คณะรัฐศาสตร์': 'Faculty of Political Science',
    'คณะวิทยาศาสตร์': 'Faculty of Science',
    'คณะเกษตรศาสตร์': 'Faculty of Agriculture',
    'คณะเภสัชศาสตร์': 'Faculty of Pharmacy',
    'คณะเภสัชศาสตร์ (หลังเดิม)': 'Faculty of Pharmacy (Old)',
    'คณะเภสัชศาสตร์ (หลังใหม่)': 'Faculty of Pharmacy (New)',
    'คณะศิลปประยุกต์และสถาปัตยกรรมศาสตร์': 'Faculty of Applied Arts and Architecture',
    'คณะศิลปศาสตร์': 'Faculty of Liberal Arts',
    'คณะพยาบาลศาสตร์': 'Faculty of Nursing',
    'วิทยาลัยแพทยศาสตร์และการสาธารณสุข': 'College of Medicine and Public Health',
    'อาคารเรียนรวม 3 (CLB3)': 'Lecture Building 3 (CLB3)',
    'อาคารเรียนรวม 4 (CLB4)': 'Lecture Building 4 (CLB4)',
    'อาคารเรียนรวม 5 (CLB5)': 'Lecture Building 5 (CLB5)',
    'ประตู 1 ม.อุบลฯ': 'UBU Gate 1',
    'ประตู 2 ม.อุบลฯ': 'UBU Gate 2',
    'ประตู 3 ม.อุบลฯ': 'UBU Gate 3',
    'อาคารเฉลิมพระเกียรติ 7 รอบพระชนมพรรษาฯ': 'Chaloem Phra Kiat Building',
    'หอสมุดกลาง (ODL)': 'Central Library (ODL)',
    'สำนักงานอธิการบดี': 'Office of the President',
    'สำนักคอมพิวเตอร์และเครือข่าย มหาวิทยาลัยอุบลราชธานี': 'Computer and Network Center, UBU',
    'โรงพยาบาลมหาวิทยาลัยอุบลราชธานี': 'UBU Hospital',
    'ปั๊ม ปตท. หน้า ม.อุบลฯ': 'PTT Station (In front of UBU)',
    'ปั้มน้ำมันPT': 'PT Gas Station',
    'ครัวพนิตา': 'Krua Panita',
    'ร้านก๋วยจั๊บบัวเขียว': 'Bua Khiao Guay Jub',
    'อร่อยใกล้ฉัน ณ ประตู 3': 'Aroi Klai Chan (Gate 3)',
    'ซุปตาร์ ชาบู ม.อุบล': 'Suptar Shabu UBU',
    'อิสานอินดี้ K&J': 'Isan Indy K&J',
    'เจริญลาบ ม.อุบลฯ': 'Charoen Larb UBU',
    'NAM NOM': 'NAM NOM',
    'นมละมุน (Nom la Moon)': 'Nom la Moon',
    'คาเฟ่ อเมซอน สาขา ปตท. มหาวิทยาลัยอุบลราชธานี': 'Cafe Amazon (PTT UBU)',
    'ตลาดนัด ม.อุบลฯ (หน้าประตู 1)': 'UBU Night Market (Gate 1)',
    'Duck cafe': 'Duck cafe',
    'OPEN BAR': 'OPEN BAR',
    'Lang Ban Camp': 'Lang Ban Camp',
    '7-Eleven สาขา หน้า ม.อุบล 2': '7-Eleven (In front of UBU 2)',
    '7-Eleven สาขา PTTOR ม.อุบล (07074)': '7-Eleven (PTTOR UBU)',
    'โลตัส โกเฟรช ม.อุบลฯ': "Lotus's go fresh (UBU)",
    'Big C mini ชุมชนศรีไค': 'Big C mini (Srikai Community)',
    'โรงพยาบาลส่งเสริมสุขภาพตำบลเมืองศรีไค': 'Mueang Srikai Sub-district Health Center',
    'เคาน์เตอร์ไปรษณีย์ สาขาเมืองศรีไค': 'Post Office (Mueang Srikai)',
    'สถานีตำรวจภูธรย่อย เทศบาลตำบลเมืองศรีไค': 'Mueang Srikai Police Sub-station',
    'โรงพยาบาลส่งเสริมสุขภาพตำบลบัววัด': 'Bua Wat Sub-district Health Center',
    'ศูนย์อนามัยที่ 10 อุบลราชธานี': 'Regional Health Center 10 Ubon',
    'สำนักงานเทศบาลตำบลธาตุ': 'That Municipality Office',
    'สำนักงานเทศบาลตำบลเมืองศรีไค': 'Mueang Srikai Municipality Office',
    'องค์การบริหารส่วนตำบลโพธิ์ใหญ่': 'Pho Yai SAO Office',
    'สวนสาธารณะ (หนองอีเจม)': 'Nong E-Jem Public Park',
    'ทุ่งหญ้าลานหมาแมว': 'Lan Ma Maew Pet Meadow',
    'เฮือนกำนันคาเฟ่ (Huankamnan Cafe)': 'Huankamnan Cafe',
    'Blue Cabin Coffee': 'Blue Cabin Coffee',
    'GOLDEN HOUR COFFEE': 'GOLDEN HOUR COFFEE',
    'Inthanin Coffee - มหาวิทยาลัยอุบลราชธานี': 'Inthanin Coffee (UBU)',
    'สนามกีฬากลาง (มหาวิทยาลัยอุบลราชธานี)': 'Main Stadium (UBU)',
    'โรงพละศึกษาอเนกประสงค์ (มหาวิทยาลัยอุบลราชธานี)': 'Multi-Purpose Gymnasium (UBU)',
    'ศูนย์กีฬาอเนกประสงค์ (มหาวิทยาลัยอุบลราชธานี)': 'Multi-Purpose Sports Complex (UBU)',
    'สระว่ายน้ำยอดเศรณี (มหาวิทยาลัยอุบลราชธานี)': 'Yodseranee Swimming Pool (UBU)',
    'ธนาคารไทยพาณิชย์ (สาขามหาวิทยาลัยอุบลราชธานี)': 'SCB Bank (UBU Branch)',
    'กลมกรอบ - ข้าวไก่ทอด Fried Chicken 炸鸡饭 (สาขา หน้า ม.อุบล)': 'Klom Krob Fried Chicken (UBU)',
    'ร้านผลไม้ริมทาง24': 'Rim Tang 24 Fruit Shop',
  };

  if (EXACT_MAP[s]) return EXACT_MAP[s];

  // Substring checks
  if (s.includes('ป.ประทีป')) return 'P. Prateep Boat Noodles';
  if (s.includes('ตลาดบังเอิญ')) return 'Bang Euen Market';
  if (s.includes('มีเจริญ')) return 'Mee Charoen Food Center';
  if (s.includes('ประตู 1')) return 'UBU Gate 1';
  if (s.includes('ประตู 2')) return 'UBU Gate 2';
  if (s.includes('ประตู 3')) return 'UBU Gate 3';

  return s;
}

export function translateZone(zone: string, isEn: boolean): string {
  if (!isEn || !zone) return zone;
  const s = zone.trim();

  // Exact database combinations
  if (s === 'โซนบ้านแมด, บ้านศรีไคออก' || s === 'บ้านแมด, บ้านศรีไคออก') {
    return 'Baan Mad, Baan Srikai Ok';
  }
  if (
    s === 'โซนบ้งมั่ง, บ้านคำลือชา' ||
    s === 'บ้งมั่ง, บ้านคำลือชา' ||
    s === 'โซนบ้งมั่ง' ||
    s.includes('บ้งมั่ง') ||
    s.includes('คำลือชา')
  ) {
    return 'Baan Kham Luecha';
  }
  if (
    s === 'โซนบ้านศรีไคตก บ้านค้อ - แขม' ||
    s === 'บ้านศรีไคตก บ้านค้อ - แขม' ||
    s.includes('บ้านศรีไคตก') ||
    s.includes('ค้อ - แขม') ||
    s.includes('ค้อ-แขม')
  ) {
    return 'Baan Srikai Tok, Baan Khor - Khaem';
  }
  if (
    s === 'โซนบ้านเก่าน้อย บ้านบัววัด' ||
    s === 'บ้านเก่าน้อย บ้านบัววัด' ||
    s.includes('บ้านเก่าน้อย') ||
    s.includes('บัววัด')
  ) {
    return 'Baan Kao Noi, Baan Bua Wat';
  }

  // Sub-terms
  if (s === 'โซนบ้านแมด') return 'Baan Mad Zone';
  if (s === 'บ้านแมด') return 'Baan Mad';
  if (s === 'บ้านศรีไคออก') return 'Baan Srikai Ok';
  if (s === 'บ้านทั้งมั่ง') return 'Baan Kham Luecha';

  return s;
}
