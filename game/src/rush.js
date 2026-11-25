// How the evening tightens: tickets come faster and wait less as the service runs,
// and the last stretch is rush hour. Pressure grows by pace alone, never by new chores.

import { RUSH, SERVICE_SECONDS, TICKETS } from './config.js';

/** 0 at the first ticket, 1 at closing time. */
export function pressureAt(clockSeconds) {
  return Math.min(1, Math.max(0, clockSeconds / SERVICE_SECONDS));
}

export function isRushHour(clockSeconds) {
  return pressureAt(clockSeconds) >= RUSH.startsAtFraction;
}

function blend(calm, rush, pressure) {
  return calm + (rush - calm) * pressure;
}

export function secondsBetweenTickets(clockSeconds) {
  return blend(TICKETS.calmEverySeconds, TICKETS.rushEverySeconds, pressureAt(clockSeconds));
}

export function ticketPatience(clockSeconds) {
  return blend(TICKETS.calmPatienceSeconds, TICKETS.rushPatienceSeconds, pressureAt(clockSeconds));
}
