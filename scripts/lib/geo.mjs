// Small planar helpers. At river scale (tens of km) an equirectangular projection
// centred on the query point is accurate to well under 1%, and far cheaper than
// great-circle maths over millions of segments.

const KM_PER_DEG_LAT = 110.574;
const kmPerDegLon = (lat) => 111.32 * Math.cos((lat * Math.PI) / 180);

export function distKm(lon1, lat1, lon2, lat2) {
  const kx = kmPerDegLon((lat1 + lat2) / 2);
  return Math.hypot((lon2 - lon1) * kx, (lat2 - lat1) * KM_PER_DEG_LAT);
}

// Distance from a point to the nearest point on any part of a (multi)line.
// `parts` is an array of coordinate arrays.
export function pointToLineKm(lon, lat, parts) {
  const kx = kmPerDegLon(lat);
  let best = Infinity;
  for (const part of parts) {
    for (let i = 0; i < part.length; i++) {
      const ax = (part[i][0] - lon) * kx;
      const ay = (part[i][1] - lat) * KM_PER_DEG_LAT;
      if (i === part.length - 1) {
        if (part.length === 1) best = Math.min(best, Math.hypot(ax, ay));
        break;
      }
      const bx = (part[i + 1][0] - lon) * kx;
      const by = (part[i + 1][1] - lat) * KM_PER_DEG_LAT;
      const dx = bx - ax, dy = by - ay;
      const len2 = dx * dx + dy * dy;
      const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
      const d = Math.hypot(ax + t * dx, ay + t * dy);
      if (d < best) best = d;
    }
  }
  return best;
}

// Lower bound on the distance from a point to anything inside a bbox.
export function pointToBboxKm(lon, lat, [x0, y0, x1, y1]) {
  const cx = Math.max(x0, Math.min(lon, x1));
  const cy = Math.max(y0, Math.min(lat, y1));
  return distKm(lon, lat, cx, cy);
}

export function partsOf(geometry) {
  return geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
}

export function bboxOf(parts) {
  let x0 = 180, y0 = 90, x1 = -180, y1 = -90;
  for (const part of parts)
    for (const [x, y] of part) {
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  return [x0, y0, x1, y1];
}

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
// Compass direction of (lon2,lat2) as seen from (lon1,lat1).
export function bearing8(lon1, lat1, lon2, lat2) {
  const kx = kmPerDegLon((lat1 + lat2) / 2);
  const ang = (Math.atan2((lon2 - lon1) * kx, (lat2 - lat1) * KM_PER_DEG_LAT) * 180) / Math.PI;
  return COMPASS[Math.round(((ang + 360) % 360) / 45) % 8];
}

export function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function pointInPolygonGeom(lon, lat, geometry) {
  const polys = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  for (const rings of polys) {
    if (!pointInRing(lon, lat, rings[0])) continue;
    let inHole = false;
    for (let h = 1; h < rings.length; h++) if (pointInRing(lon, lat, rings[h])) inHole = true;
    if (!inHole) return true;
  }
  return false;
}

// Read build/rivers.ndjson into memory.
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

export async function loadRivers(path = "build/rivers.ndjson") {
  const out = [];
  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  for await (const line of rl) if (line) out.push(JSON.parse(line));
  return out;
}
