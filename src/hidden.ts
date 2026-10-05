import type { ExpressionSpecification } from "maplibre-gl";

// Rivers marked "hidden": true in data/river-overrides.json: public/river-hidden.json,
// built by scripts/03f-hidden.mjs, { "hidden": ["<uid>", ...] }. A hidden river is left out
// of every river layer by a filter on its uid (so the tiles need no rebuild), cannot be
// picked, and is named in other rivers' panels as plain text. Fetched once; a missing file
// or a failed request means nothing is hidden.
let hidden = new Set<string>();
let loaded = false;
let request: Promise<void> | null = null;

export function loadHidden(): Promise<void> {
  request ??= fetch(`${import.meta.env.BASE_URL}river-hidden.json`)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((json: { hidden?: unknown } | null) => {
      const list = Array.isArray(json?.hidden) ? json.hidden : [];
      hidden = new Set(list.map(String));
      loaded = true;
    });
  return request;
}

export const hiddenLoaded = (): boolean => loaded;
export const isHidden = (uid: string | number): boolean => hidden.has(String(uid));

// The layer filter that leaves the hidden rivers out; null (no filter at all, so what is
// drawn is exactly what the tiles hold) when none is hidden.
export function notHiddenFilter(): ExpressionSpecification | null {
  if (!hidden.size) return null;
  return ["!", ["in", ["to-string", ["get", "uid"]], ["literal", [...hidden]]]];
}
