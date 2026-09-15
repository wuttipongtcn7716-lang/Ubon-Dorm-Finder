/**
 * ยูทิลิตี้จัดการและแปลงวันที่สำหรับระบบ Dormie UBU
 * รองรับการแปลงวันที่ภาษาไทยจากฐานข้อมูล (เช่น '5 พ.ค. 69') เป็น ISO 8601 มาตรฐาน
 * และการจัดรูปแบบวันที่แสดงผลแบบเป็นทางการ
 */

const THAI_MONTH_NAMES_SHORT: Record<string, string> = {
  'ม.ค.': '01',
  'ก.พ.': '02',
  'มี.ค.': '03',
  'เม.ย.': '04',
  'พ.ค.': '05',
  'มิ.ย.': '06',
  'ก.ค.': '07',
  'ส.ค.': '08',
  'ก.ย.': '09',
  'ต.ค.': '10',
  'พ.ย.': '11',
  'ธ.ค.': '12',
};

const THAI_MONTH_NAMES_FULL: Record<string, string> = {
  'ม.ค.': 'มกราคม',
  'ก.พ.': 'กุมภาพันธ์',
  'มี.ค.': 'มีนาคม',
  'เม.ย.': 'เมษายน',
  'พ.ค.': 'พฤษภาคม',
  'มิ.ย.': 'มิถุนายน',
  'ก.ค.': 'กรกฎาคม',
  'ส.ค.': 'สิงหาคม',
  'ก.ย.': 'กันยายน',
  'ต.ค.': 'ตุลาคม',
  'พ.ย.': 'พฤศจิกายน',
  'ธ.ค.': 'ธันวาคม',
};

/**
 * แปลงวันที่ภาษาไทย (เช่น "5 พ.ค. 69" หรือ "5-พ.ค.-69") ให้เป็น ISO 8601 String
 * เช่น "2026-05-05T00:00:00+07:00"
 */
export function parseThaiDateToIso(thaiDate?: string | null): string | undefined {
  if (!thaiDate) return undefined;
  
  const cleaned = thaiDate.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  const match = cleaned.match(/^(\d{1,2})\s+([\u0E00-\u0E7F.]+)\s+(\d{2,4})$/);
  if (!match) return undefined;

  const day = parseInt(match[1], 10);
  const monthStr = match[2];
  let year = parseInt(match[3], 10);

  // คำนวณปี พ.ศ. เป็น ค.ศ. (ค.ศ. = พ.ศ. - 543)
  if (year < 100) {
    year = 2500 + year - 543; // เช่น 69 -> 2569 - 543 = 2026
  } else if (year > 2400) {
    year = year - 543;
  }

  const month = THAI_MONTH_NAMES_SHORT[monthStr] || '05';
  const padDay = day.toString().padStart(2, '0');
  return `${year}-${month}-${padDay}T00:00:00+07:00`;
}

/**
 * จัดรูปแบบวันที่ภาษาไทยแบบทางการเต็มรูปแบบ เช่น "5 พฤษภาคม 2569"
 */
export function formatThaiDateFull(thaiDate?: string | null): string {
  if (!thaiDate) return '';

  const cleaned = thaiDate.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  const match = cleaned.match(/^(\d{1,2})\s+([\u0E00-\u0E7F.]+)\s+(\d{2,4})$/);
  if (!match) return cleaned;

  const day = parseInt(match[1], 10);
  const monthStr = match[2];
  let year = parseInt(match[3], 10);

  if (year < 100) {
    year = 2500 + year; // เช่น 69 -> 2569
  }

  const fullMonth = THAI_MONTH_NAMES_FULL[monthStr] || monthStr;
  return `${day} ${fullMonth} ${year}`;
}
