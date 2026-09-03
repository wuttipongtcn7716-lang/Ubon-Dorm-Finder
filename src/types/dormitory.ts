export interface PriceStructure {
  fan: number | null;
  air: number | null;
}

export interface Dormitory {
  id: number;
  name: string;
  zone: string;
  evaluationDate: string;
  status: 'ผ่าน' | 'ไม่ผ่าน' | 'ปรับปรุง' | string;
  lat: number;
  lng: number;
  price: PriceStructure | string;
  prices?: PriceStructure;
  type: string;
  image: string;

  // Extended properties for Dormie UBU full capabilities
  originalId: string;
  evalDate: string;
  requiredStandards: string;
  additionalStandards: string;
  evalResult: 'ผ่าน' | 'ไม่ผ่าน' | 'ปรับปรุง' | string;
  isWhiteDorm: boolean;
  remarks: string;
  latitude: number;
  longitude: number;
  minPrice: number;
  maxPrice: number;
  waterRate: string;
  electricRate: string;
  deposit: number;
  minLease: string;
  genderType: 'หอพักชาย' | 'หอพักหญิง' | 'หอพักรวม' | string;
  roomType: string;
  waterHeater: boolean;
  fridge: boolean;
  wardrobe: boolean;
  bed: boolean;
  desk: boolean;
  wifi: boolean;
  elevator: boolean;
  commonArea: boolean;
  washingMachine: boolean;
  parking: boolean;
  keycard: boolean;
  cctv: boolean;
  securityGuard: boolean;
  phone: string;
  lineId: string;
  facebook: string;
  allowPet: boolean;
  allowCooking: boolean;
  gateClosingTime: string;
  nearMainRoad: string;
  nearPub: string;
  noiseLevel: 'เงียบสงบ' | 'ปานกลาง' | 'พลุกพล่าน' | string;
  dist7Eleven: string;
  distLotus: string;
  distBigC: string;
  distMarket: string;
  distFoodCourt: string;
  floodRisk: boolean;
  images: string[];
}

export interface FilterState {
  searchTerm: string;
  zone: string;
  maxPrice: number;
  genderType: string; // 'all' | 'female' | 'male' | 'mixed'
  roomType: string; // 'all' | 'air' | 'fan'
  onlyPetAllowed: boolean;
  requireParking: boolean;
  noFloodRiskOnly: boolean;
  isWhiteDormOnly: boolean;
  onlySavedOnly?: boolean;
}
