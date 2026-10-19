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

// The dev branch is served from /dev/; mark its tab so it isn't mistaken for the live site.
if (import.meta.env.BASE_URL.endsWith("/dev/")) document.title += " (dev)";

// A phone has no room for the open guide on top of the map; it stays one tap away.
if (window.matchMedia("(max-width: 600px)").matches) document.querySelector<HTMLDetailsElement>(".guide")?.removeAttribute("open");

const map = createMap(container);
map.on("load", () => wireInteraction(map));

// Exposed for the screenshot harness in scripts/07-screenshot.mjs and console poking.
window.__map = map;
