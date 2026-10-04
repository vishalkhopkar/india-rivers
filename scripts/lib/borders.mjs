// Shared by the border tile build (04b) and its check (06b).

export const BORDER_LAYER = "borders";

// intl: India's external boundary. line: Line of Control, Line of Actual Control and the
// Shaksgam Valley boundary (drawn dotted). state: state/UT borders.
export const BORDER_KINDS = ["intl", "line", "state"];

// Borders are in every zoom from the whole-world tile up. The top zoom keeps every
// vertex and the map overzooms from it; see scripts/04b-borders.mjs for why 12.
export const BORDER_MIN_ZOOM = 0;
export const BORDER_MAX_ZOOM = 12;
