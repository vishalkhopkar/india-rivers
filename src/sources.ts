import type { IControl } from "maplibre-gl";

// Replaces MapLibre's attribution line with a "Sources" button in the bottom-right
// corner. The popup lists where the rivers' names and courses come from, government data
// first, then the base map and terrain, whose licences require the credit.
// Fun-fact sources are not listed here; each fact keeps its own.

interface Source {
  name: string;
  url?: string;
  what: string;
}

interface Group {
  heading: string;
  note?: string;
  items: Source[];
}

const OSM = "https://www.openstreetmap.org/copyright";

const GROUPS: Group[] = [
  {
    heading: "Rivers",
    items: [
      {
        name: "Central Water Commission (CWC), river network via India-WRIS",
        url: "https://indiawris.gov.in/",
        what: "Names and courses of the rivers.",
      },
      {
        name: "HydroSHEDS: HydroRIVERS v1.0 (Lehner and Grill, 2013)",
        url: "https://www.hydrosheds.org/",
        what: "Courses beyond India's borders, and valleys where no other line exists.",
      },
      {
        name: "© OpenStreetMap contributors (ODbL)",
        url: OSM,
        what: "Courses of the rivers and city streams added to the government data, corrected courses, and the borders.",
      },
      {
        name: "GeoNames (CC BY 4.0)",
        url: "https://www.geonames.org/",
        what: "Town names used to describe where rivers rise and end.",
      },
    ],
  },
  {
    heading: "City streams",
    note: "These decided which streams to show and what to call them. No line is traced from them.",
    items: [
      {
        name: "Paani.Earth, Hydrology of Bengaluru",
        url: "https://paani.earth/regions/bengaluru_homepage/hydrology-of-bengaluru/",
        what: "Bengaluru's valleys and streams.",
      },
      {
        name: "Paani.Earth, Vrishabhavathi river map",
        url: "https://paani.earth/rivers/vrishabhavathi-river-homepage/vrishabhavathi-map/",
        what: "The Vrishabhavathi's origin and its tributaries' names.",
      },
      {
        name: "Lake Development Authority / STUP, Map Showing Lakes in Bengaluru City",
        what: "Bengaluru's lakes and the storm-water drains between them.",
      },
      {
        name: "WELL Labs, Bengaluru lakes and streams map",
        what: "Bengaluru's stream network by valley.",
      },
      {
        name: "MCGM, Greater Mumbai Disaster Management Action Plan (2007)",
        url: "https://karmayog.org/wp-content/uploads/10392/15917.pdf",
        what: "Mumbai's major nallas.",
      },
      {
        name: "Adluri et al., Multi-decadal changes of Thane Creek, Current Science (2023)",
        url: "https://www.currentscience.ac.in/Volumes/124/03/0363.pdf",
        what: "Thane Creek's extent and its link with the Ulhas.",
      },
      {
        name: "Hussainsagar Lake and Catchment Area Improvement Project (Wikipedia)",
        url: "https://en.wikipedia.org/wiki/Hussainsagar_Lake_and_Catchment_Area_Improvement_Project",
        what: "The nalas that feed Hyderabad's Hussain Sagar.",
      },
    ],
  },
  {
    heading: "Base map and terrain",
    items: [
      {
        name: "OpenFreeMap",
        url: "https://openfreemap.org/",
        what: "Base map tiles.",
      },
      {
        name: "© OpenMapTiles",
        url: "https://www.openmaptiles.org/",
        what: "Base map style and schema.",
      },
      {
        name: "© OpenStreetMap contributors",
        url: OSM,
        what: "Base map data.",
      },
      {
        name: "Terrain Tiles (AWS Open Data)",
        url: "https://registry.opendata.aws/terrain-tiles/",
        what: "Elevation for the hill shading.",
      },
    ],
  },
];

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function itemHtml(s: Source): string {
  const name = s.url
    ? `<a href="${escape(s.url)}" target="_blank" rel="noopener">${escape(s.name)}</a>`
    : `<span class="sources-name">${escape(s.name)}</span>`;
  return `<li>${name}<span class="sources-what">${escape(s.what)}</span></li>`;
}

export class SourcesControl implements IControl {
  private el?: HTMLElement;
  private onDocClick = (e: MouseEvent) => {
    if (this.el && !this.el.contains(e.target as Node)) this.toggle(false);
  };
  private onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.isOpen) {
      this.toggle(false);
      this.button?.focus();
    }
  };

  private get button() {
    return this.el?.querySelector<HTMLButtonElement>(".sources-button");
  }
  private get popup() {
    return this.el?.querySelector<HTMLElement>(".sources-popup");
  }
  get isOpen(): boolean {
    return this.button?.getAttribute("aria-expanded") === "true";
  }

  onAdd(): HTMLElement {
    const el = document.createElement("div");
    el.className = "maplibregl-ctrl sources-ctrl";
    el.innerHTML =
      `<div class="sources-popup" id="sources-popup" role="dialog" aria-labelledby="sources-title" hidden>` +
      `<button type="button" class="sources-close" aria-label="Close sources">×</button>` +
      `<h2 id="sources-title">Sources</h2>` +
      GROUPS.map(
        (g) =>
          `<h3>${escape(g.heading)}</h3>` +
          (g.note ? `<p class="sources-note">${escape(g.note)}</p>` : "") +
          `<ul>${g.items.map(itemHtml).join("")}</ul>`,
      ).join("") +
      `</div>` +
      `<button type="button" class="sources-button" aria-expanded="false" aria-controls="sources-popup">` +
      `<span>Sources</span><span class="sources-icon" aria-hidden="true">i</span></button>`;
    this.el = el;
    this.button!.addEventListener("click", () => this.toggle(!this.isOpen));
    el.querySelector(".sources-close")!.addEventListener("click", () => {
      this.toggle(false);
      this.button?.focus();
    });
    document.addEventListener("click", this.onDocClick);
    document.addEventListener("keydown", this.onKey);
    return el;
  }

  onRemove(): void {
    document.removeEventListener("click", this.onDocClick);
    document.removeEventListener("keydown", this.onKey);
    this.el?.remove();
    this.el = undefined;
  }

  toggle(open: boolean): void {
    const popup = this.popup;
    if (!popup) return;
    popup.hidden = !open;
    this.button!.setAttribute("aria-expanded", String(open));
    if (open) popup.querySelector<HTMLElement>(".sources-close")?.focus();
  }
}
