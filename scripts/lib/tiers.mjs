// Lowest zoom at which a river is drawn, chosen from the measured length distribution
// so the all-India view shows ~26 rivers rather than all 30,395. The top tier starts at
// z3 because a phone has to zoom out that far to fit all of India on screen.
export function minzFor(lengthKm) {
  if (!(lengthKm > 0)) return 11;
  if (lengthKm >= 600) return 3;
  if (lengthKm >= 300) return 5;
  if (lengthKm >= 150) return 6;
  if (lengthKm >= 100) return 7;
  if (lengthKm >= 50) return 8;
  if (lengthKm >= 30) return 9;
  if (lengthKm >= 15) return 10;
  return 11;
}

export const MIN_ZOOM = 3;
export const MAX_ZOOM = 11;
