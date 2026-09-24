import { Dormitory } from '@/types/dormitory';
import { DORM_ENGLISH_NAMES } from '@/utils/bilingualHelpers';

export const DORM_ENGLISH_ALIASES: Record<number, string[]> = {
  1: ['Baan Chomdao 1', 'Chomdao 1', 'Chomdao'],
  2: ['Baan Chomdao 2', 'Chomdao 2', 'Chomdao'],
  3: ['Bua Khiao', 'Buakiew', 'Bua Kiew'],
  4: ['Bua Luang', 'Bualuang Village', 'Bualuang'],
  5: ['Boss Residence', 'Boss'],
  6: ['Top One', 'Topone'],
  7: ['Chaisanguan Mansion', 'Chaisanguan'],
  8: ['Phimlaphat', 'Phimnaphat'],
  9: ['Golden Shan', 'Golden Sun', 'Golden'],
  10: ['Sukhsiri Mansion', 'Suksiri Mansion', 'Suksiri'],
  11: ['Rakdee Place 1', 'Rakdee 1', 'Rakdee'],
  12: ['Rakdee Place 2', 'Rakdee 2', 'Rakdee'],
  13: ['Khemchat'],
  14: ['Khwanruedee', 'Kwanruedee'],
  15: ['Pheeranuch Place', 'Peeranuch'],
  16: ['Phorn-anan', 'Porn-anan'],
  17: ['Sukruthai', 'Sukruethai'],
  18: ['Homie Place', 'Homey Place', 'Homie'],
  19: ['Phorntip', 'Porntip'],
  20: ['Phongphorn 1', 'Pongporn 1'],
  21: ['Phongphorn 2', 'Pongporn 2'],
  22: ['Samaphorn', 'Samaporn'],
  23: ['Suan Khun Ya Luley', 'Luley Ho', 'Luley'],
  24: ['Baitang Mansion', 'Baitang'],
  25: ['Bandit', 'Bundit'],
  26: ['Chomchan Loft', 'Chomchan'],
  27: ['Ivory'],
  28: ['Bandit Mansion', 'Bundit Mansion'],
  29: ['Sawasdee Apartment', 'Sawasdee'],
  30: ['Wanason'],
  31: ['Thararat'],
  32: ['Dokmai Place', 'Dokmai'],
  33: ['Santisuk Mansion', 'Santisuk'],
  34: ['Panitrawee', 'Phanitrawee'],
  35: ['Katesiri', 'Ket siri'],
  36: ['Deejing Mansion 1', 'Deejing 1'],
  37: ['Deejing Mansion 2', 'Deejing 2'],
  38: ['Deejing Mansion 3', 'Deejing 3'],
  39: ['Phaendin Thong', 'Paendin Thong'],
  40: ['Kotchaporn', 'Kodchaporn'],
  41: ['Siri Place'],
  42: ['Phee Nong', 'Phi Nong'],
  43: ['Suksamer Mansion', 'Suk Samer'],
  44: ['Rosnee', 'Hotel Rosnee'],
  45: ['Siriphan'],
  46: ['Jatuphon', 'Chatuphon'],
  47: ['Mayuree Mansion', 'Mayuree'],
  48: ['Nattinee Apartment', 'Baan Farang', 'Nattinee'],
  49: ['Phitsamai', 'Pitsamai'],
  50: ['Phimcharoen', 'Pimcharoen'],
  51: ['Ruan Chao Jom', 'Ruan Chao Chom'],
  52: ['Phimsiri Apartment', 'Pimsiri'],
  53: ['Thaweechai Mansion', 'Taweechai'],
  54: ['Weeraphorn', 'Weeraporn'],
  55: ['Weeraphorn 1', 'Weeraporn 1'],
  56: ['Weeraphorn 2', 'Weeraporn 2'],
  57: ['Pornkamon', 'Ponkamon Mansion'],
  58: ['Green Home'],
  59: ['Dokmai Hom', 'Dokmaihom'],
  60: ['Rim Mor Mansion', 'Rimmor Mansion', 'Rim Mor'],
};

/**
 * Checks whether a dormitory matches a given search query in either Thai or English.
 */
export function matchesBilingualSearch(dorm: Dormitory, searchTerm: string): boolean {
  if (!searchTerm || !searchTerm.trim()) return true;

  const query = searchTerm.toLowerCase().trim();

  // 1. Direct match on Thai fields
  const matchesName = (dorm.name || '').toLowerCase().includes(query);
  const matchesZone = (dorm.zone || '').toLowerCase().includes(query);
  const matchesPhone = (dorm.phone || '').includes(query);
  const matchesRemarks = (dorm.remarks || '').toLowerCase().includes(query);

  if (matchesName || matchesZone || matchesPhone || matchesRemarks) {
    return true;
  }

  // 2. Match on English aliases and English name for this dorm
  const aliases = DORM_ENGLISH_ALIASES[dorm.id] || [];
  for (const alias of aliases) {
    if (alias.toLowerCase().includes(query)) {
      return true;
    }
  }
  const enName = DORM_ENGLISH_NAMES[dorm.id];
  if (enName && enName.toLowerCase().includes(query)) {
    return true;
  }

  // 3. Match on English synonyms and feature keywords
  // Air condition keywords: air, ac, air-conditioned, aircon
  if (query === 'air' || query === 'ac' || query === 'aircon' || query === 'air-conditioned') {
    const hasAir = (dorm.roomType || dorm.type || '').includes('แอร์') ||
      (dorm.prices?.air !== null && dorm.prices?.air !== undefined);
    if (hasAir) return true;
  }

  // Fan keywords: fan
  if (query === 'fan') {
    const hasFan = (dorm.roomType || dorm.type || '').includes('พัดลม') ||
      (dorm.prices?.fan !== null && dorm.prices?.fan !== undefined);
    if (hasFan) return true;
  }

  // Female dorm keywords: female, women, girl
  if (query === 'female' || query === 'women' || query === 'girl') {
    const isFemale = dorm.genderType === 'female' || (dorm.genderType || '').includes('หญิง');
    if (isFemale) return true;
  }

  // Male dorm keywords: male, men, boy
  if (query === 'male' || query === 'men' || query === 'boy') {
    const isMale = dorm.genderType === 'male' || (dorm.genderType || '').includes('ชาย');
    if (isMale) return true;
  }

  // Mixed dorm keywords: mixed
  if (query === 'mixed') {
    const isMixed = dorm.genderType === 'mixed' || (dorm.genderType || '').includes('รวม');
    if (isMixed) return true;
  }

  // White dorm keywords: white, whitedorm
  if (query === 'white' || query === 'whitedorm' || query === 'white dorm') {
    if (dorm.isWhiteDorm || dorm.status === 'ผ่าน' || dorm.evalResult === 'ผ่าน') return true;
  }

  // Pet keywords: pet, dog, cat
  if (query === 'pet' || query === 'dog' || query === 'cat') {
    if (dorm.allowPet) return true;
  }

  // Wifi keywords: wifi, internet
  if (query === 'wifi' || query === 'wi-fi' || query === 'internet') {
    if (dorm.wifi) return true;
  }

  // Parking keywords: parking, car
  if (query === 'parking' || query === 'car') {
    if (dorm.parking) return true;
  }

  // CCTV keywords: cctv, camera
  if (query === 'cctv' || query === 'camera') {
    if (dorm.cctv) return true;
  }

  // Zone keywords in English:
  if (query === 'mad' || query === 'srikai' || query === 'khamluecha' || query === 'buawat') {
    const zoneStr = (dorm.zone || '').toLowerCase();
    if (query === 'mad' && zoneStr.includes('แมด')) return true;
    if (query === 'srikai' && zoneStr.includes('ศรีไค')) return true;
    if (query === 'khamluecha' && zoneStr.includes('คำลือชา')) return true;
    if (query === 'buawat' && zoneStr.includes('บัววัด')) return true;
  }

  return false;
}
