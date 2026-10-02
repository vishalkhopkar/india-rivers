import {
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  addProtocol,
  setWorkerUrl,
  type ExpressionSpecification,
  type LayerSpecification,
} from "maplibre-gl";
import { Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";

export const RIVER_SOURCE = "rivers";
export const RIVER_LAYER = "river-lines";
// Rivers render as little as ~1px wide, which no one can reliably click. An invisible
// wide line carries the pointer events instead; feature state is keyed on the source,
// so highlighting still shows up on the visible layer.
export const RIVER_HIT_LAYER = "river-hit";

// From the extract's measured bbox.
const INDIA_BOUNDS: [number, number, number, number] = [68.5, 6.7, 97.3, 36.7];

const BASE_STYLE = "https://tiles.openfreemap.org/styles/positron";
const DEM_TILES = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

export const SELECTED_COLOR = "#d92b2b";
export const DOWNSTREAM_COLOR = "#ff9f1c";
const HOVER_COLOR = "#ff7a1a";

// Highlighted lines also thicken, so a thin stream is still findable once picked.
const widthBoost: ExpressionSpecification = [
  "case",
  ["boolean", ["feature-state", "selected"], false], 2.2,
  ["boolean", ["feature-state", "hover"], false], 1.8,
  1,
];

// Rivers thicken with zoom and with their own length, so a trunk river reads as a trunk
// at every zoom rather than every line converging on the same weight.
// The boost is applied inside each zoom stop, not around the whole expression:
// MapLibre only accepts a "zoom" expression at the top level of a paint property.
const lineWidth: ExpressionSpecification = [
  "interpolate", ["linear"], ["zoom"],
  4, ["*", ["interpolate", ["linear"], ["get", "len"], 500, 0.6, 3100, 1.8], widthBoost],
  7, ["*", ["interpolate", ["linear"], ["get", "len"], 100, 0.8, 3100, 2.8], widthBoost],
  10, ["*", ["interpolate", ["linear"], ["get", "len"], 15, 1, 3100, 5], widthBoost],
  14, ["*", ["interpolate", ["linear"], ["get", "len"], 5, 1.8, 3100, 10], widthBoost],
];

// Smaller streams sit lighter so the trunk network stays legible when everything is on.
const restColor: ExpressionSpecification = [
  "interpolate", ["linear"], ["get", "len"],
  5, "#7fb2d9",
  100, "#3d87c4",
  3100, "#14557f",
];

const lineColor: ExpressionSpecification = [
  "case",
  ["boolean", ["feature-state", "selected"], false], SELECTED_COLOR,
  ["boolean", ["feature-state", "hover"], false], HOVER_COLOR,
  restColor,
];

export function createMap(container: HTMLElement): MapLibreMap {
  // Production copies MapLibre's worker into the build (see vite.config.ts); dev serves
  // it straight from node_modules, where MapLibre finds it unaided.
  if (import.meta.env.PROD) setWorkerUrl(`${import.meta.env.BASE_URL}maplibre/maplibre-gl-worker.mjs`);
  addProtocol("pmtiles", new Protocol().tile);

  const map = new MapLibreMap({
    container,
    style: BASE_STYLE,
    bounds: INDIA_BOUNDS,
    fitBoundsOptions: { padding: 24 },
    minZoom: 3.5,
    maxZoom: 16,
    // Generous: a tight maxBounds clamps the opening fitBounds on wide viewports and
    // crops Kashmir and Kanyakumari out of the default view. This only exists to stop
    // the map being panned off to another continent.
    maxBounds: [
      [45, -5],
      [120, 50],
    ],
    attributionControl: { compact: true },
  });

  map.addControl(new NavigationControl({ visualizePitch: true }), "top-right");
  map.addControl(new ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");

  map.on("load", () => {
    map.addSource("dem", {
      type: "raster-dem",
      tiles: [DEM_TILES],
      encoding: "terrarium",
      tileSize: 256,
      maxzoom: 13,
      attribution: "Elevation: <a href='https://registry.opendata.aws/terrain-tiles/'>Terrain Tiles</a>",
    });

    map.addSource(RIVER_SOURCE, {
      type: "vector",
      url: `pmtiles://${location.origin}${import.meta.env.BASE_URL}rivers.pmtiles`,
      attribution: "Rivers: CWC / India-WRIS",
      // Vector tiles carry no feature id, so setFeatureState has nothing to key on
      // until uid is promoted into that slot.
      promoteId: { rivers: "uid" },
    });

    // Hillshade goes under the basemap's own labels so place names stay readable.
    const firstSymbol = map.getStyle().layers?.find((l: LayerSpecification) => l.type === "symbol")?.id;

    map.addLayer(
      {
        id: "hillshade",
        type: "hillshade",
        source: "dem",
        paint: {
          "hillshade-exaggeration": 0.45,
          "hillshade-shadow-color": "#5a6672",
          "hillshade-highlight-color": "#ffffff",
          "hillshade-accent-color": "#8d99a6",
        },
      },
      firstSymbol
    );

    map.addLayer(
      {
        id: RIVER_LAYER,
        type: "line",
        source: RIVER_SOURCE,
        "source-layer": "rivers",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": lineColor,
          "line-width": lineWidth,
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 4, 0.9, 10, 1],
        },
      },
      firstSymbol
    );

    map.addLayer(
      {
        id: RIVER_HIT_LAYER,
        type: "line",
        source: RIVER_SOURCE,
        "source-layer": "rivers",
        paint: { "line-color": "#000", "line-opacity": 0, "line-width": 14 },
      },
      firstSymbol
    );
  });

  return map;
}
