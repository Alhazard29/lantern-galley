// Scripted moments of a service, reached by replaying real play: every bowl in a
// scene was taken, chopped, cooked, plated and served through the same station code
// the player uses. index.html?scene=<name> opens one, frozen, for a screenshot.

import { faceStation } from './chef.js';
import { CHOP_STROKES, COOK, SERVICE_SECONDS } from './config.js';
import { answerEvents, updateEffects } from './feedback.js';
import { stationById } from './kitchenLayout.js';
import { printTicket } from './orders.js';
import { INGREDIENTS, RECIPES } from './recipes.js';
import { newService, updateService } from './service.js';
import { useStation } from './stations.js';

const STILL = { x: 0, y: 0 };
const FRAME = 1 / 60;
const QUIET = new Proxy({}, { get: () => () => {} }); // a sound desk with every fader down

function wait(service, seconds) {
  for (let t = 0; t < seconds; t += FRAME) {
    updateService(service, FRAME, STILL);
    answerEvents(service, QUIET);
    updateEffects(service.effects, FRAME);
  }
}

/** The chef steps to a station and uses it, as a click on it would. `settle` is how long the scene runs on after each use. */
function chefDoes(service, stationId, times = 1, settle = 0.12) {
  const station = stationById(stationId);
  service.chef.x = station.stands[0].x;
  service.chef.y = station.stands[0].y;
  faceStation(service.chef, station);
  for (let i = 0; i < times; i++) {
    useStation(service, station);
    wait(service, settle);
  }
}

function recipeNamed(id) {
  return RECIPES.find((recipe) => recipe.id === id);
}

/** Takes one ingredient through every step it needs; it ends in the chef's hands. */
function prepare(service, ingredientId) {
  chefDoes(service, 'crate-' + ingredientId);
  for (const step of INGREDIENTS[ingredientId].steps) {
    if (step === 'chop') {
      chefDoes(service, 'board-a', 1 + CHOP_STROKES + 1);
    } else {
      const heat = step === 'boil' ? 'pot' : 'wok-a';
      chefDoes(service, heat);
      wait(service, (step === 'boil' ? COOK.boilSeconds : COOK.searSeconds) + 0.2);
      chefDoes(service, heat);
    }
  }
}

function buildBowl(service, plateId, ingredientIds) {
  chefDoes(service, 'bowls');
  chefDoes(service, plateId);
  for (const id of ingredientIds) {
    prepare(service, id);
    chefDoes(service, plateId);
  }
}

function cookAndServe(service, recipeId) {
  const recipe = recipeNamed(recipeId);
  printTicket(service, recipe);
  buildBowl(service, 'plate-c', recipe.needs);
  chefDoes(service, 'plate-c');
  chefDoes(service, 'pass');
}

function openService(seed, served) {
  const service = newService(seed);
  service.orders.nextTicketIn = Infinity; // the scene prints its own tickets
  for (const recipeId of served) {
    cookAndServe(service, recipeId);
    setClock(service, 0); // the scene sets its own time of evening afterwards
  }
  return service;
}

function printWaiting(service, recipeId, patienceShare) {
  const ticket = printTicket(service, recipeNamed(recipeId));
  ticket.patienceLeft = ticket.patience * patienceShare;
  ticket.age = 5;
  return ticket;
}

function setClock(service, secondsGone) {
  service.clock = secondsGone;
  for (const state of Object.values(service.stations)) state.lastUsedAt = -10;
}

// ---------------------------------------------------------------- the scenes

/** Mid-service: every part of the kitchen busy at once. */
function midServiceScene() {
  const service = openService(11, ['lanternBowl', 'gardenScramble']);
  buildBowl(service, 'plate-b', ['mushroom', 'greens', 'prawn']);
  buildBowl(service, 'plate-a', ['noodles', 'greens']);
  prepare(service, 'greens');
  chefDoes(service, 'shelf-a');
  prepare(service, 'chili');
  chefDoes(service, 'shelf-b');
  setClock(service, 64);
  printWaiting(service, 'wharfToss', 0.42);
  printWaiting(service, 'lanternBowl', 0.7);
  printWaiting(service, 'emberPrawns', 0.86);
  printWaiting(service, 'goldenNest', 0.95);
  chefDoes(service, 'crate-noodles');
  chefDoes(service, 'pot');
  chefDoes(service, 'crate-egg');
  chefDoes(service, 'wok-a');
  wait(service, 2.4);
  chefDoes(service, 'crate-prawn');
  chefDoes(service, 'wok-b');
  chefDoes(service, 'crate-chili');
  chefDoes(service, 'board-b');
  chefDoes(service, 'crate-mushroom');
  chefDoes(service, 'board-a', 2);
  chefDoes(service, 'board-a', 1, 0.05);
  return { screen: 'service', service };
}

/** The last ingredient lands and a bowl comes ready. */
function platingScene() {
  const service = openService(23, ['emberPrawns']);
  buildBowl(service, 'plate-b', ['egg', 'greens']);
  buildBowl(service, 'plate-a', ['noodles', 'mushroom']);
  setClock(service, 38);
  printWaiting(service, 'goldenNest', 0.55);
  printWaiting(service, 'gardenScramble', 0.8);
  printWaiting(service, 'wharfToss', 0.97);
  chefDoes(service, 'crate-greens');
  chefDoes(service, 'board-b', 3);
  chefDoes(service, 'crate-prawn');
  chefDoes(service, 'wok-b');
  prepare(service, 'egg');
  chefDoes(service, 'plate-a', 1, 0.1);
  return { screen: 'service', service };
}

/** Rush hour: a full board, red lanterns, and a bowl going through the pass. */
function rushHourScene() {
  const service = openService(37, ['wharfToss', 'lanternBowl', 'goldenNest']);
  buildBowl(service, 'plate-a', ['noodles', 'mushroom', 'prawn']);
  buildBowl(service, 'plate-c', ['egg', 'greens', 'chili']);
  setClock(service, SERVICE_SECONDS * 0.55 - 1.6);
  printWaiting(service, 'gardenScramble', 0.2);
  printWaiting(service, 'captainsFeast', 0.62);
  printWaiting(service, 'emberPrawns', 0.16);
  printWaiting(service, 'wharfToss', 0.8);
  printWaiting(service, 'goldenNest', 0.88);
  printWaiting(service, 'lanternBowl', 0.96);
  chefDoes(service, 'crate-egg');
  chefDoes(service, 'wok-b');
  chefDoes(service, 'crate-noodles');
  chefDoes(service, 'pot');
  chefDoes(service, 'crate-greens');
  chefDoes(service, 'board-a', 2);
  wait(service, 1.4);
  chefDoes(service, 'plate-c');
  chefDoes(service, 'pass', 1, 0.16);
  return { screen: 'service', service };
}

/** Closing time, after a good night. */
function summaryScene() {
  const service = openService(53, ['lanternBowl', 'wharfToss', 'emberPrawns', 'goldenNest', 'gardenScramble', 'lanternBowl', 'captainsFeast', 'wharfToss', 'emberPrawns']);
  buildBowl(service, 'plate-a', ['noodles', 'egg']);
  setClock(service, SERVICE_SECONDS - 0.2);
  wait(service, 0.4);
  return { screen: 'summary', service };
}

const SCENES = {
  service: midServiceScene,
  plating: platingScene,
  rush: rushHourScene,
  summary: summaryScene,
  start: () => ({ screen: 'start', service: newService(5) }),
};

/** The scene a page address asks for (?scene=name), built and frozen, or null for normal play. */
export function sceneFromAddress(search) {
  const name = new URLSearchParams(search).get('scene');
  const build = name ? SCENES[name] : null;
  return build ? build() : null;
}
