/**
 * Global Coordinate Offset Configuration
 * Used to align Google Maps coordinates with OpenStreetMap (OSM) tiles and routing.
 * 
 * You can adjust these values to shift all place markers and OSRM route endpoints globally.
 * - LAT_OFFSET: Positive shifts North, Negative shifts South.
 * - LNG_OFFSET: Positive shifts East, Negative shifts West.
 */
export const LAT_OFFSET = -0.00008; // Recommended South shift
export const LNG_OFFSET = -0.00010; // Recommended West shift
