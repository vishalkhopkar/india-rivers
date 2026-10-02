import type { Map as MapLibreMap, MapMouseEvent, MapGeoJSONFeature } from "maplibre-gl";
import { RIVER_SOURCE, RIVER_HIT_LAYER } from "./map";
import { InfoPanel, type RiverProps } from "./panel";

// uid -> [name, minzoom, west, south, east, north, downstreamUid]
type RiverIndex = Record<string, [string, number, number, number, number, number, string]>;

let indexPromise: Promise<RiverIndex> | null = null;
function loadIndex(): Promise<RiverIndex> {
  indexPromise ??= fetch(`${import.meta.env.BASE_URL}rivers-index.json`).then((r) => {
    if (!r.ok) throw new Error(`rivers-index.json: HTTP ${r.status}`);
    return r.json();
  });
  return indexPromise;
}

export function wireInteraction(map: MapLibreMap) {
  const panel = new InfoPanel();
  let hovered: string | null = null;
  let selected: string | null = null;

  const setState = (id: string | null, key: "hover" | "selected", value: boolean) => {
    if (id === null) return;
    map.setFeatureState({ source: RIVER_SOURCE, sourceLayer: "rivers", id }, { [key]: value });
  };

  const clearHover = () => {
    if (hovered !== null) setState(hovered, "hover", false);
    hovered = null;
  };

  const clearSelection = () => {
    if (selected !== null) setState(selected, "selected", false);
    selected = null;
  };

  const select = (props: RiverProps) => {
    clearSelection();
    selected = String(props.uid);
    setState(selected, "selected", true);
    panel.show(props);
    // Warm the index now so a "Merges into" click does not wait on a download.
    loadIndex().catch(() => {});
  };

  map.on("mousemove", RIVER_HIT_LAYER, (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
    const f = e.features?.[0];
    if (!f) return;
    const id = String(f.id ?? f.properties.uid);
    if (id === hovered) return;
    clearHover();
    hovered = id;
    setState(hovered, "hover", true);
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", RIVER_HIT_LAYER, () => {
    clearHover();
    map.getCanvas().style.cursor = "";
  });

  map.on("click", RIVER_HIT_LAYER, (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
    const f = e.features?.[0];
    if (f) select(f.properties as unknown as RiverProps);
  });

  // A click that misses every river clears the selection.
  map.on("click", (e: MapMouseEvent) => {
    if (!map.queryRenderedFeatures(e.point, { layers: [RIVER_HIT_LAYER] }).length) {
      clearSelection();
      panel.hide();
    }
  });

  panel.onDismiss(clearSelection);

  // Following a "Merges into" link: fly to the downstream river, then select it once
  // its tiles have loaded, so its own panel (and its own onward link) appears.
  async function navigateTo(uid: string) {
    const entry = (await loadIndex())[uid];
    if (!entry) return;
    const [, minz, w, s, e, n] = entry;

    const pad = 48;
    const camera = map.cameraForBounds(
      [
        [w, s],
        [e, n],
      ],
      { padding: { top: pad, bottom: pad, right: pad, left: pad + panel.width } }
    );
    if (!camera) return;
    // The river is not drawn below its tier, so never stop short of it.
    const zoom = Math.min(Math.max(camera.zoom ?? minz, minz + 0.05), 13);
    map.flyTo({ center: camera.center, zoom, essential: true });

    map.once("idle", () => {
      const hit = map.querySourceFeatures(RIVER_SOURCE, {
        sourceLayer: "rivers",
        filter: ["==", ["get", "uid"], uid],
      })[0];
      if (hit) select(hit.properties as unknown as RiverProps);
    });
  }

  panel.onRiverLink((uid) => {
    navigateTo(uid).catch((err) => console.error("navigate failed", err));
  });

  return { getSelected: () => selected, clearSelection, navigateTo };
}
