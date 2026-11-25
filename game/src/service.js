// One dinner service from first ticket to closing time: owns the clock and steps
// the chef, the heat and the order board each frame. Rules live in the modules it calls.

import { RUSH, SERVICE_SECONDS } from './config.js';
import { faceStation, newChef, sendChefTo, stationChefCanUse, updateChef } from './chef.js';
import { newEffects } from './feedback.js';
import { stationAtPoint } from './kitchenLayout.js';
import { newOrderBoard, updateOrderBoard } from './orders.js';
import { isRushHour } from './rush.js';
import { newScore } from './scoring.js';
import { newStationStates, updateHeat, useStation } from './stations.js';

/** A small seeded generator, so a service (and a screenshot of one) can be replayed exactly. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function newService(seed) {
  return {
    clock: 0,
    random: seededRandom(seed),
    chef: newChef(),
    stations: newStationStates(),
    orders: newOrderBoard(),
    score: newScore(),
    effects: newEffects(),
    events: [],
    rushHour: false,
    rushBannerLeft: 0,
    closed: false,
  };
}

export function secondsLeft(service) {
  return Math.max(0, SERVICE_SECONDS - service.clock);
}

/** The chef uses whatever station they stand at. */
export function chefUses(service) {
  const station = stationChefCanUse(service.chef);
  if (!station) return false;
  faceStation(service.chef, station);
  return useStation(service, station);
}

/** A click on a station sends the chef there; they use it on arrival. */
export function chefIsSentTo(service, point) {
  const station = stationAtPoint(point.x, point.y);
  if (station) sendChefTo(service.chef, station);
}

function announceRushHour(service) {
  service.rushHour = true;
  service.rushBannerLeft = RUSH.bannerSeconds;
  service.events.push({ type: 'rushHour' });
}

/** Advances the service by dt seconds with the chef steered along `axis`. */
export function updateService(service, dt, axis) {
  if (service.closed) return;
  service.clock += dt;
  const arrivedAt = updateChef(service.chef, dt, axis);
  if (arrivedAt) useStation(service, arrivedAt);
  updateHeat(service, dt);
  updateOrderBoard(service, dt);
  if (!service.rushHour && isRushHour(service.clock)) announceRushHour(service);
  service.rushBannerLeft = Math.max(0, service.rushBannerLeft - dt);
  if (service.clock >= SERVICE_SECONDS) {
    service.closed = true;
    service.events.push({ type: 'closed' });
  }
}
