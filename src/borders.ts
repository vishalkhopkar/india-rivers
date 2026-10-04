import type { ExpressionSpecification, IControl, LayerSpecification, Map as MapLibreMap } from "maplibre-gl";
import { PMTiles, type Protocol } from "pmtiles";
import { RIVER_WIDTH_STOPS, riverWidthAt } from "./river-width";

// India's borders, drawn from public/borders.pmtiles (built by scripts/04b-borders.mjs
// from data/borders/*.geojson). Three kinds of line, in the scheme of the reference map
// the owner supplied:
//   intl   India's external boundary              black, solid, thick
//   line   Line of Control, Line of Actual        black, dotted
//          Control, Shaksgam Valley boundary
//   state  state / union territory borders        grey, solid, thin
// "Show external borders" shows intl and line; "Show state/UT borders" adds state and
// can only be on while the first one is.

export const BORDER_SOURCE = "borders";
const SOURCE_LAYER = "borders";

export const EXTERNAL_BORDER_LAYERS = ["border-intl-casing", "border-line-casing", "border-intl", "border-line"];
export const STATE_BORDER_LAYERS = ["border-state-casing", "border-state"];

// The reference map's stroke widths: 2.4 for the external boundary, 2.2 for the dotted
// lines, 0.9 for state borders. The first two are kept as they are. A state border at
// 0.9 all but disappears on this basemap, where roads are thin grey lines too, so it is
// drawn at 1.5: still clearly the thin grey line of the three.
const REF_WIDTH = { intl: 2.4, line: 2.2, state: 1.5 };
// Zoom -> multiple of the reference widths, the same for all three so their proportions
// hold at every zoom. The stops are the river-width stops on purpose: a border beside a
// river is offset by half the river plus half the border, and with shared stops that sum
// is exact at every zoom in between.
const SCALE: Record<number, number> = { 4: 0.85, 7: 1.15, 10: 1.5, 14: 1.9 };
// Clear space kept between a river's edge and the border drawn beside it, in pixels.
const RIVER_GAP: Record<number, number> = { 4: 1, 7: 1.2, 10: 1.6, 14: 2 };
// A white underlay keeps a line readable over hill shading and built-up areas. Under a
// solid line it is this many pixels wider on each side.
const CASING_PX = 1;
// Under the dotted line it is dots too, this many times the dot's diameter.
const DOT_CASING = 1.7;
const CASING_OPACITY = 0.8;

// The reference draws its dots as a 0.1-long dash every 6.1 units at stroke width 2.2,
// with round caps: round dots a little under three widths apart. MapLibre measures a
// dash pattern in line widths, so the same pattern is [0.1, 6] / 2.2. The casing's
// pattern is divided once more by its own extra width, which puts its dots at the same
// spacing, one under each black dot.
const DOTS = [0.1 / REF_WIDTH.line, 6 / REF_WIDTH.line];
const CASING_DOTS = DOTS.map((n) => n / DOT_CASING);

type Kind = keyof typeof REF_WIDTH;

const byZoom = (value: (zoom: number) => number): ExpressionSpecification =>
  ["interpolate", ["linear"], ["zoom"], ...RIVER_WIDTH_STOPS.flatMap((s) => [s.zoom, value(s.zoom)])] as ExpressionSpecification;

const widthAt = (kind: Kind, zoom: number) => REF_WIDTH[kind] * SCALE[zoom];

// A stretch that follows a river (it carries the river's uid and length) has the river's
// own geometry. It is pushed sideways so the two run side by side: half the river's
// width, a gap, half the border's own width. The build turns every such stretch to run
// downstream, so the offset always lands on the same bank (the right bank).
const riverOffset = (kind: Kind): ExpressionSpecification =>
  [
    "interpolate", ["linear"], ["zoom"],
    ...RIVER_WIDTH_STOPS.flatMap((stop) => [
      stop.zoom,
      [
        "case",
        ["has", "rlen"],
        ["+", ["/", riverWidthAt(stop, "rlen"), 2], RIVER_GAP[stop.zoom] + widthAt(kind, stop.zoom) / 2],
        0,
      ],
    ]),
  ] as ExpressionSpecification;

function layersFor(kind: Kind, color: string): [casing: LayerSpecification, line: LayerSpecification] {
  const dotted = kind === "line";
  const base = {
    type: "line" as const,
    source: BORDER_SOURCE,
    "source-layer": SOURCE_LAYER,
    filter: ["==", ["get", "kind"], kind] as ExpressionSpecification,
  };
  // Start hidden: the switches are off when the page loads.
  const layout = { visibility: "none" as const, "line-cap": "round" as const, "line-join": "round" as const };
  return [
    {
      ...base,
      id: `border-${kind}-casing`,
      layout,
      paint: {
        "line-color": "#fff",
        "line-opacity": CASING_OPACITY,
        "line-width": byZoom((z) => (dotted ? widthAt(kind, z) * DOT_CASING : widthAt(kind, z) + CASING_PX * 2)),
        "line-offset": riverOffset(kind),
        ...(dotted ? { "line-dasharray": CASING_DOTS } : {}),
      },
    },
    {
      ...base,
      id: `border-${kind}`,
      layout,
      paint: {
        "line-color": color,
        "line-width": byZoom((z) => widthAt(kind, z)),
        "line-offset": riverOffset(kind),
        ...(dotted ? { "line-dasharray": DOTS } : {}),
      },
    },
  ];
}

export interface BorderSwitches {
  external: boolean;
  states: boolean;
}

// The two switches for the top-right corner. Both start off. The state/UT switch is
// disabled until external borders are on, and goes off with them.
export class BordersControl implements IControl {
  private el?: HTMLElement;
  private map?: MapLibreMap;
  private ready = false;
  private switches: BorderSwitches = { external: false, states: false };

  onAdd(map: MapLibreMap): HTMLElement {
    this.map = map;
    const el = document.createElement("div");
    el.className = "maplibregl-ctrl borders-toggle";
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", "Borders");
    el.innerHTML =
      `<label><span>Show external borders</span><input type="checkbox" role="switch" data-border="external" /></label>` +
      `<label><span>Show state/UT borders</span><input type="checkbox" role="switch" data-border="states" disabled /></label>`;
    const external = el.querySelector('[data-border="external"]') as HTMLInputElement;
    const states = el.querySelector('[data-border="states"]') as HTMLInputElement;
    const stateLabel = states.closest("label") as HTMLLabelElement;

    const sync = () => {
      if (!external.checked) states.checked = false;
      states.disabled = !external.checked;
      stateLabel.classList.toggle("is-disabled", states.disabled);
      // A hint for the pointer; a disabled switch already announces itself as unavailable.
      stateLabel.title = states.disabled ? "Turn on external borders first" : "";
      this.switches = { external: external.checked, states: states.checked };
      this.apply();
    };
    external.addEventListener("change", sync);
    states.addEventListener("change", sync);
    // Space flips a checkbox on its own; a switch is expected to answer to Enter too.
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target instanceof HTMLInputElement && !e.target.disabled) e.target.click();
    });
    sync();

    this.el = el;
    return el;
  }

  onRemove(): void {
    this.el?.remove();
    this.map = undefined;
  }

  get state(): BorderSwitches {
    return { ...this.switches };
  }

  // Adds the source and layers, all hidden until a switch asks for them. `underRivers`
  // is the layer the white casings go beneath, so a casing never eats into a river;
  // `underLabels` keeps the lines themselves below every place name.
  // If the archive is missing or empty nothing is added and the switches do nothing.
  async addLayers(protocol: Protocol, underRivers: string, underLabels: string | undefined): Promise<void> {
    const map = this.map;
    if (!map) return;
    const url = `${location.origin}${import.meta.env.BASE_URL}borders.pmtiles`;
    try {
      const archive = new PMTiles(url);
      const header = await archive.getHeader();
      if (!header.numAddressedTiles) throw new Error("the archive has no tiles");
      // Hand the opened archive to the protocol so its header is not fetched twice.
      protocol.add(archive);
    } catch (err) {
      console.warn(`Borders unavailable (${url}):`, err);
      return;
    }
    if (this.map !== map) return; // removed while the header was loading

    map.addSource(BORDER_SOURCE, {
      type: "vector",
      url: `pmtiles://${url}`,
      attribution: "Borders: <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
    });
    const state = layersFor("state", "#9a9a9a");
    const intl = layersFor("intl", "#000");
    const line = layersFor("line", "#000");
    for (const casing of [state[0], intl[0], line[0]]) map.addLayer(casing, underRivers);
    for (const top of [state[1], intl[1], line[1]]) map.addLayer(top, underLabels);
    this.ready = true;
    this.apply();
  }

  private apply(): void {
    if (!this.ready || !this.map) return;
    const show = (ids: string[], on: boolean) => {
      for (const id of ids) this.map!.setLayoutProperty(id, "visibility", on ? "visible" : "none");
    };
    show(EXTERNAL_BORDER_LAYERS, this.switches.external);
    show(STATE_BORDER_LAYERS, this.switches.external && this.switches.states);
  }
}
