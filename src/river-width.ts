import type { ExpressionSpecification } from "maplibre-gl";

// How wide a river is drawn, in pixels: at each zoom stop the width runs linearly from
// `min` for a river `fromKm` long to `max` for one `toKm` long, and between stops it is
// interpolated by zoom. Kept as a table because two things read it: the river layer
// itself (src/map.ts) and the border drawn beside a river (src/borders.ts), which has to
// stand clear of the river's edge at every zoom.
export const RIVER_WIDTH_STOPS: { zoom: number; fromKm: number; min: number; toKm: number; max: number }[] = [
  { zoom: 4, fromKm: 500, min: 0.6, toKm: 3100, max: 1.8 },
  { zoom: 7, fromKm: 100, min: 0.8, toKm: 3100, max: 2.8 },
  { zoom: 10, fromKm: 15, min: 1, toKm: 3100, max: 5 },
  { zoom: 14, fromKm: 5, min: 1.8, toKm: 3100, max: 10 },
];

// The river's width at one of the stops above, from a feature property holding its
// length in km (`len` on a river, `rlen` on a border stretch that follows one).
export const riverWidthAt = (stop: (typeof RIVER_WIDTH_STOPS)[number], lengthProp: string): ExpressionSpecification => [
  "interpolate", ["linear"], ["get", lengthProp],
  stop.fromKm, stop.min,
  stop.toKm, stop.max,
];
