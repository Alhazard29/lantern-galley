// The chef: walks the floor by keys or toward a clicked station, goes round the
// plating island instead of through it, and keeps the little bits of motion
// (stride, knife swing) the drawing reads.

import { CHEF, FLOOR } from './config.js';
import { ISLAND, nearestStand, stationInReach } from './kitchenLayout.js';

// The island grown by the chef's own width: the chef's centre may not enter it.
const BLOCK = {
  left: ISLAND.x - CHEF.radius - 2,
  right: ISLAND.x + ISLAND.w + CHEF.radius + 2,
  top: ISLAND.y - CHEF.radius - 2,
  bottom: ISLAND.y + ISLAND.h + CHEF.radius + 2,
};
const CORNERS = [
  { x: BLOCK.left - 3, y: BLOCK.top - 3 },
  { x: BLOCK.right + 3, y: BLOCK.top - 3 },
  { x: BLOCK.left - 3, y: BLOCK.bottom + 3 },
  { x: BLOCK.right + 3, y: BLOCK.bottom + 3 },
];

export function newChef() {
  return { x: 470, y: 400, facing: 0, holding: null, walkTo: null, swing: 0, stride: 0, moving: false };
}

function clampToFloor(chef) {
  chef.x = Math.min(FLOOR.right, Math.max(FLOOR.left, chef.x));
  chef.y = Math.min(FLOOR.bottom, Math.max(FLOOR.top, chef.y));
}

/** Slides the chef back out of the island along the shortest way out. */
function pushOutOfIsland(chef) {
  if (chef.x <= BLOCK.left || chef.x >= BLOCK.right || chef.y <= BLOCK.top || chef.y >= BLOCK.bottom) return;
  const exits = [
    { gap: chef.x - BLOCK.left, apply: () => (chef.x = BLOCK.left) },
    { gap: BLOCK.right - chef.x, apply: () => (chef.x = BLOCK.right) },
    { gap: chef.y - BLOCK.top, apply: () => (chef.y = BLOCK.top) },
    { gap: BLOCK.bottom - chef.y, apply: () => (chef.y = BLOCK.bottom) },
  ];
  exits.sort((a, b) => a.gap - b.gap);
  exits[0].apply();
}

/** True when the straight line between two floor points crosses the island. */
function islandBlocksWay(ax, ay, bx, by) {
  let enter = 0;
  let leave = 1;
  const dx = bx - ax;
  const dy = by - ay;
  const edges = [
    [-dx, ax - (BLOCK.left + 1)],
    [dx, BLOCK.right - 1 - ax],
    [-dy, ay - (BLOCK.top + 1)],
    [dy, BLOCK.bottom - 1 - ay],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) enter = Math.max(enter, t);
    else leave = Math.min(leave, t);
    if (enter > leave) return false;
  }
  return true;
}

/** Where to head next on the way to a spot: the spot itself, or the island corner that gets round fastest. */
function nextWaypoint(chef, goal) {
  if (!islandBlocksWay(chef.x, chef.y, goal.x, goal.y)) return goal;
  let best = null;
  let bestLength = Infinity;
  for (const corner of CORNERS) {
    if (islandBlocksWay(chef.x, chef.y, corner.x, corner.y)) continue;
    const onward = islandBlocksWay(corner.x, corner.y, goal.x, goal.y) ? 400 : 0;
    const length = Math.hypot(corner.x - chef.x, corner.y - chef.y) + Math.hypot(goal.x - corner.x, goal.y - corner.y) + onward;
    if (length < bestLength) {
      best = corner;
      bestLength = length;
    }
  }
  return best ?? goal;
}

function stepToward(chef, target, distance) {
  const dx = target.x - chef.x;
  const dy = target.y - chef.y;
  const gap = Math.hypot(dx, dy);
  if (gap <= distance) {
    chef.x = target.x;
    chef.y = target.y;
    return true;
  }
  chef.x += (dx / gap) * distance;
  chef.y += (dy / gap) * distance;
  chef.facing = Math.atan2(dy, dx);
  return false;
}

/** Sends the chef walking to a station; they stop at whichever of its standing spots is nearer. */
export function sendChefTo(chef, station) {
  chef.walkTo = { station, stand: nearestStand(station, chef.x, chef.y) };
}

/** Moves the chef for one frame. Returns the station a click-walk has just arrived at, or null. */
export function updateChef(chef, dt, axis) {
  chef.swing = Math.max(0, chef.swing - dt * 5);
  let arrivedAt = null;
  const steering = axis.x !== 0 || axis.y !== 0;
  if (steering) {
    chef.walkTo = null;
    const length = Math.hypot(axis.x, axis.y);
    chef.x += (axis.x / length) * CHEF.speed * dt;
    chef.y += (axis.y / length) * CHEF.speed * dt;
    chef.facing = Math.atan2(axis.y, axis.x);
  } else if (chef.walkTo) {
    const goal = chef.walkTo.stand;
    const waypoint = nextWaypoint(chef, goal);
    if (stepToward(chef, waypoint, CHEF.speed * dt) && waypoint === goal) {
      arrivedAt = chef.walkTo.station;
      chef.walkTo = null;
    }
  }
  chef.moving = steering || chef.walkTo !== null;
  if (chef.moving) chef.stride += dt * 11;
  clampToFloor(chef);
  pushOutOfIsland(chef);
  if (arrivedAt) faceStation(chef, arrivedAt);
  return arrivedAt;
}

export function faceStation(chef, station) {
  chef.facing = Math.atan2(station.y - chef.y, station.x - chef.x);
}

/** The station the chef would use if they pressed the button now. */
export function stationChefCanUse(chef) {
  return stationInReach(chef.x, chef.y, CHEF.reach);
}
