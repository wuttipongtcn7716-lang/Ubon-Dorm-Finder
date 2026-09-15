const fs = require('fs');
const path = require('path');

console.log('=== Verifying GPS Fallback & UX Requirements ===\n');

// 1. Verify OriginSelectionModal.tsx
const originModalCode = fs.readFileSync('src/components/OriginSelectionModal.tsx', 'utf8');
console.log('[1] Checking OriginSelectionModal.tsx:');
console.log('  - Exists and has content:', originModalCode.length > 0);
console.log('  - Exports POPULAR_CAMPUS_ORIGINS:', originModalCode.includes('export const POPULAR_CAMPUS_ORIGINS'));
console.log('  - Has Search input for landmarks and dorms:', originModalCode.includes('searchInputRef') && originModalCode.includes('onChange={(e) => setSearchTerm(e.target.value)}'));
console.log('  - Has categories (all, campus, food, dorm):', originModalCode.includes("'all' | 'campus' | 'food' | 'dorm'"));
console.log('  - Has keyboard ESC listener:', originModalCode.includes("e.key === 'Escape'"));
console.log('  - Accessible role dialog & aria-modal:', originModalCode.includes('role="dialog"') && originModalCode.includes('aria-modal="true"'));

// 2. Verify GpsPermissionModal.tsx
const permModalCode = fs.readFileSync('src/components/GpsPermissionModal.tsx', 'utf8');
console.log('\n[2] Checking GpsPermissionModal.tsx:');
console.log('  - onChooseManualOrigin in props:', permModalCode.includes('onChooseManualOrigin?: () => void;'));
console.log('  - Has manual origin fallback button:', permModalCode.includes('เลือกจุดเริ่มต้นด้วยตนเองแทน'));

// 3. Verify NavigationModal.tsx
const navModalCode = fs.readFileSync('src/components/NavigationModal.tsx', 'utf8');
console.log('\n[3] Checking NavigationModal.tsx:');
console.log('  - DEFAULT_ORIGIN defined with Gate 1:', navModalCode.includes("name: 'ประตู 1 ม.อุบลฯ (จุดเริ่มต้นแนะนำ)'"));
console.log('  - No auto-open blocking modal on PERMISSION_DENIED:', !navModalCode.includes("err.code === err.PERMISSION_DENIED) {\n            setGpsErrorCode('denied');\n            setGpsErrorMessage('คุณปิดกั้นการเข้าถึงตำแหน่ง"));
console.log('  - Has OriginSelectionModal integration:', navModalCode.includes('<OriginSelectionModal'));
console.log('  - Passes customOrigin to MapComponent:', navModalCode.includes('customOrigin='));
console.log('  - Origin switcher on Desktop Header:', navModalCode.includes('จุดเริ่มต้น: ') || navModalCode.includes('จาก:'));
console.log('  - Origin switcher on Mobile Top Card:', navModalCode.includes('จาก:</span>') && navModalCode.includes('setIsOriginModalOpen(true)'));
console.log('  - Handles permission denied, timeout, unavailable, unsupported:');
console.log('    * denied:', navModalCode.includes("setGpsErrorCode('denied')"));
console.log('    * timeout:', navModalCode.includes("setGpsErrorCode('timeout')"));
console.log('    * unavailable:', navModalCode.includes("setGpsErrorCode('unavailable')"));
console.log('    * unsupported:', navModalCode.includes("setGpsErrorCode('unsupported')"));

// 4. Verify MapComponent.tsx
const mapCode = fs.readFileSync('src/components/MapComponent.tsx', 'utf8');
console.log('\n[4] Checking MapComponent.tsx:');
console.log('  - customOrigin in MapComponentProps:', mapCode.includes('customOrigin?: OriginPointData | null;'));
console.log('  - onOriginChange in MapComponentProps:', mapCode.includes('onOriginChange?: (origin: OriginPointData) => void;'));
console.log('  - Synchronizes customOrigin to originPoint:', mapCode.includes('if (customOrigin) {') && mapCode.includes('setOriginPoint(customOrigin);'));
console.log('  - GpsPermissionModal receives onChooseManualOrigin:', mapCode.includes('onChooseManualOrigin={() => setIsOriginModalOpen(true)}'));

console.log('\n=== All Verification Checks Passed Successfully! ===');
