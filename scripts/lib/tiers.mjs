// Lowest zoom at which a river is drawn, chosen from the measured length distribution
// so the all-India view shows ~26 rivers rather than all 30,395.
export function minzFor(lengthKm) {
  if (!(lengthKm > 0)) return 11;
  if (lengthKm >= 600) return 4;
  if (lengthKm >= 300) return 5;
  if (lengthKm >= 150) return 6;
  if (lengthKm >= 100) return 7;
  if (lengthKm >= 50) return 8;
  if (lengthKm >= 30) return 9;
  if (lengthKm >= 15) return 10;
  return 11;
}

export const MIN_ZOOM = 4;
export const MAX_ZOOM = 11;
