import dormDetailsLastJson from './dormDetailsLast.json';

export interface DormLatestExpenses {
  rentPrice: string;
  waterRate: string;
  electricRate: string;
  deposit: string;
  minLease: string;
  note: string;
}

export interface DormLatestRoomAndTenant {
  genderType: string;
  roomType: string;
}

export interface DormLatestRoomAmenities {
  waterHeater: string;
  refrigerator: string;
  wardrobe: string;
  bed: string;
  desk: string;
  wifi: string;
}

export interface DormLatestCommonFacilities {
  elevator: string;
  commonArea: string;
  washingMachine: string;
  parking: string;
}

export interface DormLatestSecurity {
  keycard: string;
  cctv: string;
  guard: string;
}

export interface DormLatestRules {
  pet: string;
  cooking: string;
  gateClosingTime: string;
}

export interface DormLatestEnvironment {
  nearMainRoad: string;
  nearPub: string;
  noiseLevel: string;
  floodRisk: string;
}

export interface DormLatestNearbyPlaces {
  sevenEleven: string;
  lotusGoFresh: string;
  bigCMini: string;
  bungEunMarket: string;
  meeCharoenFoodCenter: string;
}

export interface DormLatestContact {
  phone: string;
  lineId: string;
  facebook: string;
}

export interface DormLatestDetail {
  id: number;
  excelId: string;
  excelName: string;
  evaluationDate: string;
  zone: string;
  evalResult: string;
  expenses: DormLatestExpenses;
  roomAndTenant: DormLatestRoomAndTenant;
  roomAmenities: DormLatestRoomAmenities;
  commonFacilities: DormLatestCommonFacilities;
  security: DormLatestSecurity;
  rules: DormLatestRules;
  environment: DormLatestEnvironment;
  nearbyPlaces: DormLatestNearbyPlaces;
  contact: DormLatestContact;
  rawExcel: Record<string, string>;
}

export const dormDetailsLast: DormLatestDetail[] = dormDetailsLastJson as DormLatestDetail[];

export function getDormLatestDetails(dormId: number): DormLatestDetail | null {
  return dormDetailsLast.find((d) => d.id === dormId) || null;
}
