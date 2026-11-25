// Lantern Galley: boots the page, runs the frame loop and moves between the start
// screen, a dinner service and its summary. Rules, drawing and sound are in the
// modules it imports; this file only connects them.

import { stationChefCanUse } from './chef.js';
import { SCREEN } from './config.js';
import { sceneFromAddress } from './demoScenes.js';
import { answerEvents, updateEffects } from './feedback.js';
import { listenForInput } from './input.js';
import { STATIONS } from './kitchenLayout.js';
import { createKitchenSound } from './kitchenSound.js';
import { chefIsSentTo, chefUses, newService, secondsLeft, updateService } from './service.js';
import { drawChef } from './render/drawChef.js';
import { drawEffects, shakeOffset } from './render/drawEffects.js';
import { drawControlsHint, drawHud, drawRushBanner } from './render/drawHud.js';
import { drawKitchen, drawKitchenPrompt } from './render/drawKitchen.js';
import { drawOrderBoard } from './render/drawOrderBoard.js';
import { drawPauseVeil, drawServiceSummary, drawStartScreen } from './render/drawScreens.js';

const canvas = document.getElementById('galley');
canvas.width = SCREEN.width;
canvas.height = SCREEN.height;
const ctx = canvas.getContext('2d');
const input = listenForInput(canvas);
const sound = createKitchenSound();

const app = {
  screen: 'start', // 'start' | 'service' | 'summary'
  service: newService(1),
  paused: false,
  time: 0,
  lastTickSecond: -1,
};

function openTheGalley() {
  app.service = newService(Date.now() % 2147483647);
  app.screen = 'service';
  app.paused = false;
  app.lastTickSecond = -1;
  sound.setMusicPace(1);
}

/** Every bowl in play: on the plating counter or in the chef's hands. The order board ticks them off. */
function bowlsInPlay(service) {
  const bowls = [];
  for (const station of STATIONS) {
    const state = service.stations[station.id];
    if (state.bowl) bowls.push(state.bowl);
    if (state.item && state.item.kind === 'bowl') bowls.push(state.item);
  }
  if (service.chef.holding && service.chef.holding.kind === 'bowl') bowls.push(service.chef.holding);
  return bowls;
}

function tickLastSeconds(service) {
  const left = Math.ceil(secondsLeft(service));
  if (left <= 10 && left !== app.lastTickSecond) {
    app.lastTickSecond = left;
    sound.tick();
  }
}

function handleKeys() {
  for (const code of input.takePresses()) {
    sound.unlock();
    if (code === 'KeyM') sound.toggleMute();
    if (app.screen === 'service') {
      if (code === 'KeyP' || code === 'Escape') app.paused = !app.paused;
      else if (input.isUseKey(code) && !app.paused) chefUses(app.service);
    } else if (input.isUseKey(code)) {
      openTheGalley();
    }
  }
}

function handleClick() {
  const point = input.takeClick();
  if (!point) return;
  sound.unlock();
  if (app.screen !== 'service') openTheGalley();
  else if (!app.paused) chefIsSentTo(app.service, point);
}

function update(dt) {
  app.time += dt;
  handleKeys();
  handleClick();
  if (app.screen !== 'service' || app.paused) return;
  const service = app.service;
  updateService(service, dt, input.steering());
  answerEvents(service, sound);
  updateEffects(service.effects, dt);
  tickLastSeconds(service);
  sound.setMusicPace(service.rushHour ? 1.4 : 1);
  if (service.closed) app.screen = 'summary';
}

function draw() {
  const service = app.service;
  const inReach = app.screen === 'service' ? stationChefCanUse(service.chef) : null;
  const jolt = shakeOffset(service.effects, service.clock);
  ctx.save();
  ctx.translate(jolt.x, jolt.y);
  drawKitchen(ctx, service, inReach);
  drawChef(ctx, service.chef, service.clock);
  drawKitchenPrompt(ctx, service, inReach);
  drawEffects(ctx, service.effects);
  ctx.restore();
  drawOrderBoard(ctx, service, bowlsInPlay(service));
  drawHud(ctx, service);
  drawRushBanner(ctx, service);
  if (app.screen === 'service' && service.clock < 14) drawControlsHint(ctx, sound.isMuted());  if (app.screen === 'start') drawStartScreen(ctx, app.time);
  if (app.screen === 'summary') drawServiceSummary(ctx, service.score, app.time);
  if (app.paused) drawPauseVeil(ctx);
}

let lastFrame = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000 || 0);
  lastFrame = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

const scene = sceneFromAddress(window.location.search);
if (scene) {
  // A frozen, scripted moment (see demoScenes.js): drawn once and left standing.
  app.screen = scene.screen;
  app.service = scene.service;
  draw();
  document.documentElement.dataset.scene = 'drawn';
} else {
  requestAnimationFrame(frame);
}
