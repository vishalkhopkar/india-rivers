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
import { BasinsToggle } from "./basins-toggle";
import { BordersControl } from "./borders";
import { FEATURES } from "./config";
import { loadHidden, notHiddenFilter } from "./hidden";
import { RIVER_WIDTH_STOPS, riverWidthAt } from "./river-width";
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
const lineWidth = [
  "interpolate", ["linear"], ["zoom"],
  ...RIVER_WIDTH_STOPS.flatMap((stop) => [stop.zoom, ["*", riverWidthAt(stop, "len"), widthBoost]]),
] as ExpressionSpecification;

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
  const hiddenRequest = loadHidden();
  const pmtiles = new Protocol();
  addProtocol("pmtiles", pmtiles.tile);

  const map = new MapLibreMap({
    container,
    style: BASE_STYLE,
    bounds: INDIA_BOUNDS,
    fitBoundsOptions: { padding: 24 },
    // z3 lets a phone fit all of India; the tiles start at z3 for the same reason.
    minZoom: 3,
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

  // Added first so they sit above the zoom buttons in the same corner.
  const borders = new BordersControl();
  map.addControl(borders, "top-right");
  if (FEATURES.showBasinsToggle) map.addControl(new BasinsToggle(), "top-right");
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
      attribution:
        "Rivers: CWC / India-WRIS | Places: <a href='https://www.geonames.org/'>GeoNames</a> | " +
        "Courses abroad and added rivers: <a href='https://www.hydrosheds.org/'>HydroSHEDS</a>, <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
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

    // Borders go above the rivers and below the place names; they stay hidden until one
    // of the switches is turned on, and take no pointer events (those are the hit
    // layer's alone).
    void borders.addLayers(pmtiles, RIVER_LAYER, firstSymbol);

    // Hidden rivers (public/river-hidden.json) are filtered out of both river layers.
    // The request started with the map, so it has normally arrived by now.
    void hiddenRequest.then(() => {
      const filter = notHiddenFilter();
      for (const id of [RIVER_LAYER, RIVER_HIT_LAYER]) map.setFilter(id, filter);
    });
  });

  return map;
}
