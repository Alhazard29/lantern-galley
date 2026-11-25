// What happens when the chef uses a station: take from a crate, chop on a board,
// drop into a wok or the pot, build a bowl on the plating counter, serve at the pass.
// Each use changes the service and reports an event; drawing and sound live elsewhere.

import { CHOP_STROKES, COOK } from './config.js';
import { STATIONS } from './kitchenLayout.js';
import { serveBowl } from './orders.js';
import { bowlCanTake, isReadyForBowl, makeBowl, makeIngredient, nextStepOf, recipeMatching } from './recipes.js';

const HEAT_STEP = { wok: 'sear', pot: 'boil' };

export function newStationStates() {
  const states = {};
  for (const station of STATIONS) {
    states[station.id] = { item: null, strokes: 0, heat: 0, bowl: null, lastUsedAt: -10 };
  }
  return states;
}

function cookSeconds(stationType) {
  return stationType === 'pot' ? COOK.boilSeconds : COOK.searSeconds;
}

/** 0 to 1 while cooking, above 1 once done and drifting toward burnt (2 = burnt). */
export function heatProgress(station, state) {
  if (!state.item) return 0;
  const need = cookSeconds(station.type);
  if (state.heat <= need) return state.heat / need;
  return 1 + Math.min(1, (state.heat - need) / COOK.burnAfterSeconds);
}

/** Runs the woks and the pot: finishes what is cooking, and burns what is forgotten. */
export function updateHeat(service, dt) {
  for (const station of STATIONS) {
    if (!HEAT_STEP[station.type]) continue;
    const state = service.stations[station.id];
    const item = state.item;
    if (!item || item.burnt) continue;
    const before = state.heat;
    state.heat += dt;
    const need = cookSeconds(station.type);
    if (before < need && state.heat >= need) {
      item.stepsDone += 1;
      service.events.push({ type: 'cooked', station, item });
    }
    if (state.heat >= need + COOK.burnAfterSeconds) {
      item.burnt = true;
      service.events.push({ type: 'burnt', station, item });
    }
  }
}

function refuse(service, station, why) {
  service.events.push({ type: 'refused', station, why, x: service.chef.x, y: service.chef.y });
  return false;
}

function addToBowl(service, station, bowl, item) {
  if (!isReadyForBowl(item)) return refuse(service, station, item.burnt ? 'Burnt: bin it' : 'Needs ' + nextStepOf(item));
  if (!bowlCanTake(bowl.contents, item.id)) return refuse(service, station, 'No recipe takes that');
  bowl.contents.push(item.id);
  const recipe = recipeMatching(bowl.contents);
  service.events.push({ type: recipe ? 'bowlComplete' : 'plated', station, item, recipe });
  return true;
}

function useCrate(service, station) {
  if (service.chef.holding) return refuse(service, station, 'Hands full');
  service.chef.holding = makeIngredient(station.ingredient);
  service.events.push({ type: 'picked', station });
  return true;
}

function useBowlStack(service, station) {
  if (service.chef.holding) return refuse(service, station, 'Hands full');
  service.chef.holding = makeBowl();
  service.events.push({ type: 'picked', station });
  return true;
}

function useBoard(service, station, state) {
  const chef = service.chef;
  const held = chef.holding;
  if (!state.item) {
    if (!held) return refuse(service, station, 'Bring something to chop');
    if (nextStepOf(held) !== 'chop') return refuse(service, station, 'Nothing to chop there');
    state.item = held;
    state.strokes = 0;
    chef.holding = null;
    service.events.push({ type: 'placed', station });
    return true;
  }
  if (nextStepOf(state.item) === 'chop') {
    if (held) return refuse(service, station, 'Hands full');
    state.strokes += 1;
    chef.swing = 1;
    const done = state.strokes >= CHOP_STROKES;
    if (done) state.item.stepsDone += 1;
    service.events.push({ type: done ? 'chopDone' : 'chop', station, item: state.item });
    return true;
  }
  // Chopped and waiting: straight into a carried bowl, or into the chef's hands.
  if (held && held.kind === 'bowl') {
    if (!addToBowl(service, station, held, state.item)) return false;
    state.item = null;
    return true;
  }
  if (held) return refuse(service, station, 'Hands full');
  chef.holding = state.item;
  state.item = null;
  service.events.push({ type: 'picked', station });
  return true;
}

function useHeat(service, station, state) {
  const chef = service.chef;
  const held = chef.holding;
  const step = HEAT_STEP[station.type];
  if (!state.item) {
    if (!held) return refuse(service, station, 'Bring something to ' + step);
    if (nextStepOf(held) !== step) {
      const needs = nextStepOf(held);
      return refuse(service, station, needs ? 'Needs ' + needs + ' first' : 'Nothing to ' + step + ' there');
    }
    state.item = held;
    state.heat = 0;
    chef.holding = null;
    service.events.push({ type: 'onHeat', station });
    return true;
  }
  if (nextStepOf(state.item) === step) return refuse(service, station, 'Still cooking');
  if (held && held.kind === 'bowl' && !state.item.burnt) {
    if (!addToBowl(service, station, held, state.item)) return false;
    state.item = null;
    return true;
  }
  if (held) return refuse(service, station, 'Hands full');
  chef.holding = state.item;
  state.item = null;
  service.events.push({ type: 'picked', station });
  return true;
}

function usePlate(service, station, state) {
  const chef = service.chef;
  const held = chef.holding;
  if (!state.bowl) {
    if (held && held.kind === 'bowl') {
      state.bowl = held;
      chef.holding = null;
      service.events.push({ type: 'placed', station });
      return true;
    }
    return refuse(service, station, held ? 'Set a bowl down first' : 'Bring a bowl');
  }
  if (!held) {
    chef.holding = state.bowl;
    state.bowl = null;
    service.events.push({ type: 'picked', station });
    return true;
  }
  if (held.kind === 'bowl') return refuse(service, station, 'A bowl is already here');
  if (!addToBowl(service, station, state.bowl, held)) return false;
  chef.holding = null;
  return true;
}

/** A resting shelf holds one thing, anything: park a chopped pile or a half-built bowl for a later ticket. */
function useShelf(service, station, state) {
  const chef = service.chef;
  const held = chef.holding;
  if (!state.item) {
    if (!held) return refuse(service, station, 'Nothing to rest here');
    state.item = held;
    chef.holding = null;
    service.events.push({ type: 'placed', station });
    return true;
  }
  if (!held) {
    chef.holding = state.item;
    state.item = null;
    service.events.push({ type: 'picked', station });
    return true;
  }
  if (held.kind === 'bowl' && state.item.kind === 'ingredient') {
    if (!addToBowl(service, station, held, state.item)) return false;
    state.item = null;
    return true;
  }
  return refuse(service, station, 'Shelf is taken');
}

function usePass(service, station) {
  const held = service.chef.holding;
  if (!held || held.kind !== 'bowl') return refuse(service, station, 'Bring a finished bowl');
  if (!recipeMatching(held.contents)) return refuse(service, station, 'Bowl is not finished');
  if (!serveBowl(service, held)) return refuse(service, station, 'No ticket for that dish');
  service.chef.holding = null;
  return true;
}

function useBin(service, station) {
  if (!service.chef.holding) return refuse(service, station, 'Nothing to bin');
  service.chef.holding = null;
  service.score.binned += 1;
  service.events.push({ type: 'binned', station });
  return true;
}

const USE = {
  crate: useCrate,
  bowls: useBowlStack,
  board: useBoard,
  wok: useHeat,
  pot: useHeat,
  plate: usePlate,
  shelf: useShelf,
  pass: usePass,
  bin: useBin,
};

/** The chef uses a station. Returns true when something happened. */
export function useStation(service, station) {
  const state = service.stations[station.id];
  state.lastUsedAt = service.clock;
  return USE[station.type](service, station, state);
}

/** One or two words on what using the station would do right now, for the prompt over it. */
export function promptFor(service, station) {
  const state = service.stations[station.id];
  const held = service.chef.holding;
  switch (station.type) {
    case 'crate':
      return held ? 'Hands full' : 'Take';
    case 'bowls':
      return held ? 'Hands full' : 'Take bowl';
    case 'board':
      if (!state.item) return held && nextStepOf(held) === 'chop' ? 'Set down' : 'Chopping board';
      if (nextStepOf(state.item) === 'chop') return 'Chop!';
      return held && held.kind === 'bowl' ? 'Add to bowl' : 'Take';
    case 'wok':
    case 'pot': {
      const step = HEAT_STEP[station.type];
      if (!state.item) return held && nextStepOf(held) === step ? (step === 'boil' ? 'Boil' : 'Sear') : station.type === 'pot' ? 'Noodle pot' : 'Wok';
      if (state.item.burnt) return 'Take burnt';
      if (nextStepOf(state.item) === step) return 'Cooking…';
      return held && held.kind === 'bowl' ? 'Add to bowl' : 'Take';
    }
    case 'plate':
      if (!state.bowl) return held && held.kind === 'bowl' ? 'Set bowl' : 'Plating spot';
      if (!held) return 'Take bowl';
      return held.kind === 'bowl' ? 'Spot taken' : 'Plate it';
    case 'shelf':
      if (!state.item) return held ? 'Rest it here' : 'Resting shelf';
      if (!held) return 'Take';
      return held.kind === 'bowl' && state.item.kind === 'ingredient' ? 'Add to bowl' : 'Shelf taken';
    case 'pass':
      return held && held.kind === 'bowl' ? 'Serve!' : 'The pass';
    case 'bin':
      return held ? 'Bin it' : 'Bin';
    default:
      return '';
  }
}
