// Shared constants for the parent dashboard's live map.
// Kept here so the orchestrating screen (index.tsx) and the LiveMap component
// agree on the exact same zoom bounds / staleness window — no duplication.

// How old a bus GPS fix may be before the info panel flags it as "last known".
export const STALE_LOCATION_MS = 90_000;

// Zoom bounds for the manual controls (MapTiler streets is useful to ~18)
export const ZOOM_DEFAULT = 14;
export const ZOOM_MIN = 5;
export const ZOOM_MAX = 18;
export const ZOOM_STEP = 1;
export const ZOOM_ANIMATION_MS = 450;
