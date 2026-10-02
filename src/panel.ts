import { FEATURES } from "./config";

export type EndKind = "trib" | "sea" | "border" | "inland";

export interface RiverProps {
  uid: string;
  name: string;
  len: number;
  kind: EndKind;
  into: string;
  down: string;
  o: string;
  on: boolean;
  e: string;
  en: boolean;
  basin?: string;
  sub?: string;
  states?: string;
  origin?: string;
  confl?: string;
  from?: string;
  to?: string;
}

// How the far end of a river is labelled. `near` applies when the description is a
// bare place name; otherwise the text already carries its own relation
// ("40 km west of Bharuch, Gujarat") and "near" would read wrongly.
const END_LABELS: Record<EndKind, { into: string; near: string; far: string }> = {
  trib: { into: "Merges into", near: "Confluence near", far: "Confluence" },
  sea: { into: "Mouth into", near: "Mouth near", far: "Mouth" },
  border: { into: "Flows into", near: "Leaves India near", far: "Leaves India" },
  inland: { into: "Drains into", near: "Ends near", far: "Ends" },
};

const INTO_TEXT: Partial<Record<EndKind, (into: string) => string>> = {
  inland: () => "An inland basin, with no outlet to the sea",
};

type Row = [label: string, value: string | Node];

export class InfoPanel {
  private el: HTMLElement;
  private body: HTMLElement;
  private onClose?: () => void;
  private onNavigate?: (uid: string) => void;

  constructor(parent: HTMLElement = document.body) {
    this.el = document.createElement("aside");
    this.el.className = "panel";
    this.el.hidden = true;
    this.el.innerHTML = `<button class="panel-close" type="button" aria-label="Close">&times;</button><div class="panel-body"></div>`;
    this.body = this.el.querySelector(".panel-body") as HTMLElement;
    this.el.querySelector(".panel-close")?.addEventListener("click", () => {
      this.hide();
      this.onClose?.();
    });
    parent.appendChild(this.el);
  }

  onDismiss(fn: () => void) {
    this.onClose = fn;
  }

  onRiverLink(fn: (uid: string) => void) {
    this.onNavigate = fn;
  }

  get width(): number {
    return this.el.hidden ? 0 : this.el.getBoundingClientRect().width;
  }

  show(p: RiverProps) {
    const labels = END_LABELS[p.kind] ?? END_LABELS.trib;

    const rows: Row[] = [
      ["Length", `${p.len.toLocaleString()} km`],
      [p.on ? "Origin near" : "Origin", p.o],
      [labels.into, this.intoValue(p)],
      [p.en ? labels.near : labels.far, p.e],
    ];

    const extended: Row[] = FEATURES.showExtendedAttributes
      ? ([
          ["Basin", p.basin],
          ["Sub-basin", p.sub],
          ["States", p.states],
          ["Rises in", p.from],
          ["Ends in", p.to],
          ["Recorded origin", p.origin],
          ["Recorded confluence", p.confl],
        ].filter(([, v]) => v && String(v).trim() && !/partially/i.test(String(v))) as Row[])
      : [];

    this.body.replaceChildren(
      el("h2", {}, p.name || "Unnamed river"),
      list(rows),
      ...(extended.length ? [el("h3", {}, "More details"), list(extended)] : [])
    );
    this.el.hidden = false;
  }

  hide() {
    this.el.hidden = true;
  }

  private intoValue(p: RiverProps): string | Node {
    const text = INTO_TEXT[p.kind]?.(p.into) ?? p.into;
    if (p.kind !== "trib" || !p.down) return text;
    const a = el("a", { href: `#river-${p.down}`, class: "river-link" }, text) as HTMLAnchorElement;
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      this.onNavigate?.(p.down);
    });
    return a;
  }
}

function list(rows: Row[]): HTMLElement {
  const dl = el("dl", {});
  for (const [k, v] of rows) {
    if (v === "" || v == null) continue;
    dl.append(el("dt", {}, k), el("dd", {}, v));
  }
  return dl;
}

function el(tag: string, attrs: Record<string, string>, child?: string | Node): HTMLElement {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (child != null) node.append(child);
  return node;
}
