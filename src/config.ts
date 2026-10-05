// Product switches. Changing a default here requires a rebuild; any switch can also be
// turned on for one visit from the URL, e.g. ?features=showBasinsToggle (comma-separate
// several), to try unfinished work on the live site.
const DEFAULTS = {
  // Basin, sub-basin, states and the raw source fields are kept in the data but hidden
  // from the river panel unless this is on.
  showExtendedAttributes: false,
  // "Show river basins" switch in the top-right corner. Basins aren't drawn yet.
  showBasinsToggle: false,
  // The dotted Line of Control, Line of Actual Control and Shaksgam Valley boundary. When
  // on, they are drawn with the external borders ("Show external borders"); when off they
  // are never drawn, whatever that switch says.
  showLocLac: false,
};

const fromUrl = new Set(
  (new URLSearchParams(location.search).get("features") ?? "").split(",").map((s) => s.trim())
);

export const FEATURES = Object.fromEntries(
  Object.entries(DEFAULTS).map(([k, v]) => [k, v || fromUrl.has(k)])
) as typeof DEFAULTS;
