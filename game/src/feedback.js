// Instant answers to what the chef does: every event of the service becomes flying
// bits off the board, a sparkle on the plate, a tip floating over the pass, a sound.

import { stationById } from './kitchenLayout.js';

export const FOOD_COLOURS = {
  noodles: ['#f3d27a', '#e8b84f'],
  mushroom: ['#b9825a', '#e9d3b4'],
  greens: ['#6fbf4a', '#b8e07a'],
  egg: ['#fff6df', '#f7b52c'],
  prawn: ['#ff8f6b', '#ffd0bd'],
  chili: ['#e23b2e', '#ff8a5c'],
};

export function newEffects() {
  return { particles: [], popups: [], rings: [], shake: 0, passGlow: 0, alarm: 0 };
}

function burst(effects, random, x, y, colours, count, speed, life) {
  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2;
    const pace = speed * (0.4 + random() * 0.8);
    effects.particles.push({
      x, y,
      vx: Math.cos(angle) * pace,
      vy: Math.sin(angle) * pace - speed * 0.25,
      size: 3 + random() * 4,
      spin: random() * 6,
      colour: colours[Math.floor(random() * colours.length)],
      life, age: 0,
    });
  }
}

function popup(effects, x, y, text, colour, size = 22) {
  effects.popups.push({ x, y, text, colour, size, life: 1.3, age: 0 });
}

function ring(effects, x, y, colour) {
  effects.rings.push({ x, y, colour, life: 0.5, age: 0 });
}

const ANSWERS = {
  chop(service, event, sound) {
    burst(service.effects, service.random, event.station.x, event.station.y, FOOD_COLOURS[event.item.id], 7, 150, 0.45);
    service.effects.shake = Math.max(service.effects.shake, 0.12);
    sound.chop();
  },
  chopDone(service, event, sound) {
    burst(service.effects, service.random, event.station.x, event.station.y, FOOD_COLOURS[event.item.id], 14, 190, 0.6);
    ring(service.effects, event.station.x, event.station.y, '#fff3c4');
    popup(service.effects, event.station.x + 70, event.station.y - 30, 'Chopped!', '#fff3c4', 18);
    sound.chop();
    sound.ready();
  },
  cooked(service, event, sound) {
    ring(service.effects, event.station.x, event.station.y, '#ffd27a');
    popup(service.effects, event.station.x - 80, event.station.y - 34, 'Done!', '#ffd27a', 18);
    sound.ready();
  },
  burnt(service, event, sound) {
    popup(service.effects, event.station.x - 80, event.station.y - 34, 'Burnt!', '#ff6b5a', 20);
    service.effects.shake = Math.max(service.effects.shake, 0.25);
    sound.refuse();
  },
  onHeat(service, event, sound) {
    sound.sizzle();
  },
  plated(service, event, sound) {
    burst(service.effects, service.random, event.station.x, event.station.y, FOOD_COLOURS[event.item.id], 8, 110, 0.4);
    ring(service.effects, event.station.x, event.station.y, '#bfeee6');
    sound.plate();
  },
  bowlComplete(service, event, sound) {
    burst(service.effects, service.random, event.station.x, event.station.y, ['#fff3c4', '#ffd27a', '#ffffff'], 18, 170, 0.7);
    ring(service.effects, event.station.x, event.station.y, '#ffd27a');
    popup(service.effects, event.station.x, event.station.y - 62, event.recipe.name + ' ready!', '#ffe9a8', 20);
    sound.plate();
    sound.ready();
  },
  served(service, event, sound) {
    const pass = stationById('pass');
    burst(service.effects, service.random, pass.x, pass.y, ['#ffd27a', '#ffffff', '#7fe0c8'], 22, 220, 0.8);
    const times = event.multiplier > 1 ? '  ×' + event.multiplier.toFixed(2).replace(/0$/, '') : '';
    popup(service.effects, pass.x, pass.y - 190, '+' + event.tip + times, '#ffe9a8', 30);
    service.effects.passGlow = 1;
    sound.served();
  },
  ticketPrinted(service, event, sound) {
    sound.ticket();
  },
  ticketMissed(service, event, sound) {
    popup(service.effects, 132, 120, 'Ticket walked out  −15', '#ff6b5a', 18);
    service.effects.alarm = 1;
    service.effects.shake = Math.max(service.effects.shake, 0.3);
    sound.missed();
  },
  refused(service, event, sound) {
    popup(service.effects, event.x, event.y - 48, event.why, '#ffb4a8', 16);
    sound.refuse();
  },
  picked(service, event, sound) {
    sound.pick();
  },
  placed(service, event, sound) {
    sound.pick();
  },
  binned(service, event, sound) {
    sound.bin();
  },
  rushHour(service, event, sound) {
    service.effects.shake = Math.max(service.effects.shake, 0.35);
    sound.rush();
  },
  closed(service, event, sound) {
    sound.closing();
  },
};

/** Turns the events the service reported this frame into effects and sound, then clears them. */
export function answerEvents(service, sound) {
  for (const event of service.events) {
    const answer = ANSWERS[event.type];
    if (answer) answer(service, event, sound);
  }
  service.events.length = 0;
}

function age(list, dt) {
  for (const thing of list) thing.age += dt;
  return list.filter((thing) => thing.age < thing.life);
}

export function updateEffects(effects, dt) {
  for (const p of effects.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 520 * dt;
  }
  effects.particles = age(effects.particles, dt);
  effects.popups = age(effects.popups, dt);
  effects.rings = age(effects.rings, dt);
  effects.shake = Math.max(0, effects.shake - dt);
  effects.passGlow = Math.max(0, effects.passGlow - dt * 1.5);
  effects.alarm = Math.max(0, effects.alarm - dt * 1.2);
}
