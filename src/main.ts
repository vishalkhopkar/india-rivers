import "./style.css";
import { createMap } from "./map";
import { wireInteraction } from "./interaction";
import type { Map as MapLibreMap } from "maplibre-gl";

declare global {
  interface Window {
    __map: MapLibreMap;
  }
}

const container = document.getElementById("map");
if (!container) throw new Error("#map missing");

const map = createMap(container);
map.on("load", () => wireInteraction(map));

// Exposed for the screenshot harness in scripts/07-screenshot.mjs and console poking.
window.__map = map;
