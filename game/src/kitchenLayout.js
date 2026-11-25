// Where every station of the galley kitchen stands. The counters run round the four
// sides of the floor: pantry crates along the back, boards on the left, the heat on the
// right, resting shelves and the pass at the front. The plating island sits in the
// middle of the floor, so every route between two counters goes round it.
// `stands` are the floor spots the chef can use a station from.

import { INGREDIENT_ORDER } from './recipes.js';

export const COUNTERS = {
  back: { x: 264, y: 64, w: 1016, h: 136 },
  left: { x: 264, y: 200, w: 120, h: 400 },
  right: { x: 1160, y: 200, w: 120, h: 400 },
  front: { x: 264, y: 600, w: 1016, h: 120 },
};

export const ISLAND = { x: 520, y: 320, w: 500, h: 170 };

function backStation(id, type, x, extra = {}) {
  return { id, type, x, y: 138, stands: [{ x, y: 232 }], ...extra };
}
function leftStation(id, type, y, extra = {}) {
  return { id, type, x: 324, y, stands: [{ x: 416, y }], ...extra };
}
function rightStation(id, type, y, extra = {}) {
  return { id, type, x: 1220, y, stands: [{ x: 1128, y }], ...extra };
}
function frontStation(id, type, x, extra = {}) {
  return { id, type, x, y: 660, stands: [{ x, y: 568 }], ...extra };
}
/** A plating spot on the island can be used from the front of it or from behind. */
function islandStation(id, x) {
  const y = ISLAND.y + ISLAND.h / 2;
  return { id, type: 'plate', x, y, stands: [{ x, y: ISLAND.y + ISLAND.h + 34 }, { x, y: ISLAND.y - 34 }] };
}

export const STATIONS = [
  ...INGREDIENT_ORDER.map((ingredient, i) => backStation('crate-' + ingredient, 'crate', 440 + i * 108, { ingredient })),
  backStation('bowls', 'bowls', 1096),
  leftStation('board-a', 'board', 280),
  leftStation('board-b', 'board', 412),
  leftStation('bin', 'bin', 536),
  rightStation('wok-a', 'wok', 276),
  rightStation('wok-b', 'wok', 400),
  rightStation('pot', 'pot', 528),
  islandStation('plate-a', 610),
  islandStation('plate-b', 770),
  islandStation('plate-c', 930),
  frontStation('shelf-a', 'shelf', 450),
  frontStation('shelf-b', 'shelf', 570),
  frontStation('shelf-c', 'shelf', 690),
  frontStation('pass', 'pass', 1010),
];

export function stationById(id) {
  return STATIONS.find((station) => station.id === id) ?? null;
}

/** The standing spot of a station nearest to a point on the floor. */
export function nearestStand(station, fromX, fromY) {
  let best = station.stands[0];
  for (const stand of station.stands) {
    if (Math.hypot(fromX - stand.x, fromY - stand.y) < Math.hypot(fromX - best.x, fromY - best.y)) best = stand;
  }
  return best;
}

/** The station whose counter spot holds the point, for mouse clicks. */
export function stationAtPoint(px, py) {
  let best = null;
  let bestDistance = Infinity;
  for (const station of STATIONS) {
    const reach = station.type === 'pass' ? 110 : 62;
    const d = Math.hypot(px - station.x, py - station.y);
    if (d < reach && d < bestDistance) {
      best = station;
      bestDistance = d;
    }
  }
  return best;
}

/** The station the chef could use from where they stand: the nearest standing spot within reach. */
export function stationInReach(chefX, chefY, reach) {
  let best = null;
  let bestDistance = reach;
  for (const station of STATIONS) {
    const stand = nearestStand(station, chefX, chefY);
    const d = Math.hypot(chefX - stand.x, chefY - stand.y);
    if (d < bestDistance) {
      best = station;
      bestDistance = d;
    }
  }
  return best;
}
