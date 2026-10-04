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
  // Set only for rivers formed by a confluence: comma-joined former uids, the matching
  // "|"-joined display names, and where the confluence is.
  fb?: string;
  fbn?: string;
  fa?: string;
  // Distributaries: the river it branches off, and where.
  bf?: string;
  bfn?: string;
  bat?: string;
  batn?: boolean;
  // The same water under a new name: the river it continues.
  cf?: string;
  cfn?: string;
  // Rivers entering from abroad: countries crossed before India, and where it crosses.
  ab?: boolean;
  via?: string;
  ent?: string;
  entn?: boolean;
  basin?: string;
  sub?: string;
  states?: string;
  origin?: string;
  confl?: string;
  from?: string;
  to?: string;
  src?: string;
  // Set when the river it flows into is this river under another name (Main Drain No 8
  // becomes the Najafgarh Drain): there is no confluence to describe.
  ct?: boolean;
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

// Fun facts, keyed by uid: public/river-facts.json, built from data/river-facts.json by
// scripts/03d-facts.mjs. Only a sample of rivers has one. Fetched once, when the first
// panel opens; a panel already showing when it arrives is redrawn.
let facts: Record<string, string[]> | null = null;
let factsRequest: Promise<void> | null = null;
function loadFacts(): Promise<void> {
  factsRequest ??= fetch(`${import.meta.env.BASE_URL}river-facts.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((json: Record<string, string[]>) => {
      facts = json;
    });
  return factsRequest;
}

// Rivers tagged "Doubtful naturality", and why: public/river-naturality.json, built by
// scripts/03e-naturality.mjs. `rivers` maps a uid to its explanation in `texts`, which
// many rivers share. Fetched like the facts; none is tagged if the file is missing.
let naturality: { texts: string[]; rivers: Record<string, number> } | null = null;
let naturalityRequest: Promise<void> | null = null;
function loadNaturality(): Promise<void> {
  naturalityRequest ??= fetch(`${import.meta.env.BASE_URL}river-naturality.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((json: { texts?: string[]; rivers?: Record<string, number> } | null) => {
      naturality = { texts: json?.texts ?? [], rivers: json?.rivers ?? {} };
    });
  return naturalityRequest;
}

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
    // A tap or click anywhere else closes the "Doubtful naturality" tooltip.
    document.addEventListener("pointerdown", (ev) => {
      const tip = this.body.querySelector<HTMLElement>(".naturality-tip");
      if (tip && !(ev.target as Element | null)?.closest?.(".naturality")) tip.hidden = true;
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

  private shown?: RiverProps;

  show(p: RiverProps) {
    this.shown = p;
    if (!facts || !naturality)
      void Promise.all([loadFacts(), loadNaturality()]).then(() => this.shown === p && !this.el.hidden && this.show(p));
    const labels = END_LABELS[p.kind] ?? END_LABELS.trib;

    const rows: Row[] = [
      ["Length", `${p.len.toLocaleString()} km`],
      ...this.startRows(p),
      ...this.endRows(p, labels),
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
          ["Course from", p.src ? `${p.src} (approximate; not in the CWC data)` : ""],
        ].filter(([, v]) => v && String(v).trim() && !/partially/i.test(String(v))) as Row[])
      : [];

    const riverFacts = facts?.[p.uid] ?? [];
    const doubt = naturality?.texts[naturality.rivers[p.uid]];
    this.body.replaceChildren(
      el("h2", {}, p.name || "Unnamed river"),
      ...(doubt ? [this.naturalityTag(doubt)] : []),
      list(rows),
      ...(riverFacts.length
        ? [el("h3", { class: "fact-heading" }, "Fun Facts"), ...riverFacts.map((f) => el("p", { class: "fact" }, this.factText(f)))]
        : []),
      ...(extended.length ? [el("h3", {}, "More details"), list(extended)] : [])
    );
    this.el.hidden = false;
  }

  hide() {
    this.el.hidden = true;
  }

  // How a river begins. Only a river that rises at a source has an "Origin"; the others
  // are described by what they come from.
  private startRows(p: RiverProps): Row[] {
    if (p.fb)
      return [
        ["Formed by", this.formedByValue(p)],
        ["Formed at", p.fa ?? ""],
      ];
    if (p.bf)
      return [
        ["Branched off from", this.riverLink(p.bf, p.bfn ?? "")],
        [p.batn ? "Branches off near" : "Branches off", p.bat ?? ""],
      ];
    if (p.cf) return [["Continues from", this.riverLink(p.cf, p.cfn ?? "")]];
    const origin: Row = [p.on ? "Origin near" : "Origin", p.o];
    if (p.ab)
      return [
        origin,
        ["Flows through", p.via ?? ""],
        [p.entn ? "Enters India near" : "Enters India", p.ent ?? ""],
      ];
    return [origin];
  }

  private endRows(p: RiverProps, labels: (typeof END_LABELS)[EndKind]): Row[] {
    if (p.ct && p.down) {
      const renamed = p.into !== p.name;
      return [
        ["Continues to", this.riverLink(p.down, p.into)],
        [renamed ? (p.en ? "Name changes near" : "Name changes") : p.en ? "Continues near" : "Continues", p.e],
      ];
    }
    return [
      [labels.into, this.intoValue(p)],
      [p.en ? labels.near : labels.far, p.e],
    ];
  }

  private intoValue(p: RiverProps): string | Node {
    const text = INTO_TEXT[p.kind]?.(p.into) ?? p.into;
    if (p.kind !== "trib" || !p.down) return text;
    return this.riverLink(p.down, text);
  }

  // "Confluence of A and B" or "Confluence of A, B and C", each name a link.
  private formedByValue(p: RiverProps): Node {
    const uids = (p.fb ?? "").split(",");
    const names = (p.fbn ?? "").split("|");
    const frag = document.createDocumentFragment();
    frag.append("Confluence of ");
    uids.forEach((uid, i) => {
      if (i > 0) frag.append(i === uids.length - 1 ? " and " : ", ");
      frag.append(this.riverLink(uid, names[i] ?? ""));
    });
    return frag;
  }

  // The "Doubtful naturality" tag under the name, and a "?" button whose tooltip says why.
  // The tooltip opens on hover and on keyboard focus, and stays while the pointer is on the
  // row or on the tooltip itself. A phone has no hover: there a tap opens it, and a second
  // tap, or a tap anywhere else, closes it.
  private naturalityTag(why: string): HTMLElement {
    const row = el("div", { class: "naturality" });
    const help = el("button", { type: "button", class: "naturality-help", "aria-label": "About doubtful naturality", "aria-describedby": "naturality-tip" }, "?");
    const tip = el("div", { id: "naturality-tip", class: "naturality-tip", role: "tooltip", hidden: "" }, why);
    const open = (on: boolean) => (tip.hidden = !on);
    help.addEventListener("pointerenter", (ev) => ev.pointerType === "mouse" && open(true));
    row.addEventListener("pointerleave", (ev) => ev.pointerType === "mouse" && document.activeElement !== help && open(false));
    help.addEventListener("focus", () => open(true));
    help.addEventListener("blur", () => open(false));
    help.addEventListener("keydown", (ev) => ev.key === "Escape" && open(false));
    // A tap is a focus and then a click: the click closes the tooltip only if it was
    // already open before the tap.
    let wasOpen = false;
    help.addEventListener("pointerdown", (ev) => (wasOpen = ev.pointerType !== "mouse" && !tip.hidden));
    help.addEventListener("click", () => {
      open(!wasOpen);
      wasOpen = false;
    });
    row.append(el("span", { class: "naturality-tag" }, "Doubtful naturality"), help, tip);
    return row;
  }

  // A fact may name another river as [[uid|text]], which becomes a link to it.
  private factText(fact: string): Node {
    const frag = document.createDocumentFragment();
    let at = 0;
    for (const m of fact.matchAll(/\[\[(\d+)\|([^\]]+)\]\]/g)) {
      frag.append(fact.slice(at, m.index), this.riverLink(m[1], m[2]));
      at = m.index + m[0].length;
    }
    frag.append(fact.slice(at));
    return frag;
  }

  private riverLink(uid: string, text: string): HTMLAnchorElement {
    const a = el("a", { href: `#river-${uid}`, class: "river-link" }, text || "Unnamed river") as HTMLAnchorElement;
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      this.onNavigate?.(uid);
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
