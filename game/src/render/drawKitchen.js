// The galley kitchen: a barge deck, tiled counters on four sides, a string of lanterns,
// and every station drawn with what is on it right now.

import { CHOP_STROKES, SCREEN } from '../config.js';
import { COUNTERS, ISLAND, STATIONS, nearestStand } from '../kitchenLayout.js';
import { INGREDIENTS, nextStepOf, recipeMatching } from '../recipes.js';
import { heatProgress, promptFor } from '../stations.js';
import { drawBowl, drawHalfChopped, drawIngredient, drawIngredientStage } from './drawFood.js';
import { drawLabel, drawTag } from './drawText.js';

const DECK = '#3a2a26';
const DECK_SEAM = '#2c1f1c';
const TILE = '#efe2c4';
const TILE_SEAM = '#d8c8a2';
const COUNTER_LIP = '#17555e';

function drawDeck(ctx) {
  ctx.fillStyle = DECK;
  ctx.fillRect(264, 64, SCREEN.width - 264, SCREEN.height - 64);
  ctx.strokeStyle = DECK_SEAM;
  ctx.lineWidth = 2;
  for (let y = 200; y <= 600; y += 40) {
    ctx.beginPath();
    ctx.moveTo(384, y);
    ctx.lineTo(1160, y);
    ctx.stroke();
  }
  for (let row = 0; row < 10; row++) {
    for (let x = 384 + (row % 2) * 97; x < 1160; x += 194) {
      ctx.beginPath();
      ctx.moveTo(x, 200 + row * 40);
      ctx.lineTo(x, 240 + row * 40);
      ctx.stroke();
    }
  }
}

/** The plating island in the middle of the deck: tiled like the counters, with its own teal rim. */
function drawIsland(ctx) {
  const { x, y, w, h } = ISLAND;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + 6, y + 8, w, h);
  drawCounter(ctx, ISLAND);
  ctx.lineWidth = 7;
  ctx.strokeStyle = COUNTER_LIP;
  ctx.strokeRect(x, y, w, h);
  drawLabel(ctx, 'PLATING ISLAND', x + w / 2, y + h - 12, { size: 10, colour: '#17555e' });
}

function drawCounter(ctx, { x, y, w, h }) {
  ctx.fillStyle = TILE;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = TILE_SEAM;
  ctx.lineWidth = 1;
  for (let tx = x + 40; tx < x + w; tx += 40) {
    ctx.beginPath();
    ctx.moveTo(tx, y);
    ctx.lineTo(tx, y + h);
    ctx.stroke();
  }
  for (let ty = y + 40; ty < y + h; ty += 40) {
    ctx.beginPath();
    ctx.moveTo(x, ty);
    ctx.lineTo(x + w, ty);
    ctx.stroke();
  }
}

function drawCounters(ctx) {
  for (const counter of Object.values(COUNTERS)) drawCounter(ctx, counter);
  // The teal lip where each counter meets the floor.
  ctx.fillStyle = COUNTER_LIP;
  ctx.fillRect(384, 192, 776, 8);
  ctx.fillRect(384, 600, 776, 8);
  ctx.fillRect(376, 192, 8, 416);
  ctx.fillRect(1160, 192, 8, 416);
}

function drawLantern(ctx, x, y, sway, rushHour) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sway);
  ctx.beginPath();
  ctx.arc(0, 16, 22, 0, Math.PI * 2);
  ctx.fillStyle = rushHour ? 'rgba(255, 90, 60, 0.22)' : 'rgba(255, 190, 90, 0.2)';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 16, 10, 13, 0, 0, Math.PI * 2);
  ctx.fillStyle = rushHour ? '#ff5a3c' : '#ffb347';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = rushHour ? '#a3200f' : '#b56a12';
  ctx.stroke();
  ctx.fillStyle = '#2b1d16';
  ctx.fillRect(-5, 1, 10, 4);
  ctx.fillRect(-5, 27, 10, 4);
  ctx.restore();
}

function drawLanternString(ctx, clock, rushHour) {
  ctx.beginPath();
  ctx.moveTo(264, 66);
  for (let x = 264; x <= 1280; x += 127) ctx.quadraticCurveTo(x + 63, 80, x + 127, 66);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#2b1d16';
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const sway = Math.sin(clock * (rushHour ? 5 : 1.6) + i * 1.3) * (rushHour ? 0.22 : 0.07);
    drawLantern(ctx, 327 + i * 127, 72, sway, rushHour);
  }
}

// ---------------------------------------------------------------- stations

function drawCrate(ctx, station) {
  const { x, y } = station;
  ctx.beginPath();
  ctx.roundRect(x - 46, y - 40, 92, 76, 8);
  ctx.fillStyle = '#9a6a3c';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#5f3d1f';
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(x - 38, y - 32, 76, 60, 5);
  ctx.fillStyle = '#4a3018';
  ctx.fill();
  drawIngredientStage(ctx, station.ingredient, 'raw', x - 18, y - 10, 0.82);
  drawIngredientStage(ctx, station.ingredient, 'raw', x + 18, y - 10, 0.82);
  drawIngredientStage(ctx, station.ingredient, 'raw', x, y + 10, 0.9);
  drawTag(ctx, INGREDIENTS[station.ingredient].name.split(' ')[1].toUpperCase(), x, y + 46, { size: 12, fill: '#17555e', colour: '#fdf6e3', pad: 7 });
}

function drawBowlStack(ctx, station) {
  const { x, y } = station;
  drawBowl(ctx, [], x + 8, y + 6, 34);
  drawBowl(ctx, [], x + 2, y, 34);
  drawBowl(ctx, [], x - 4, y - 6, 34);
  drawTag(ctx, 'BOWLS', x, y + 46, { size: 12, fill: '#17555e', colour: '#fdf6e3', pad: 7 });
}

function drawShelf(ctx, station, state) {
  const { x, y } = station;
  ctx.beginPath();
  ctx.roundRect(x - 50, y - 40, 100, 80, 10);
  ctx.fillStyle = '#b98a58';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#7a5530';
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(x - 42, y - 32, 84, 64, 6);
  ctx.fillStyle = '#d9b57f';
  ctx.fill();
  if (!state.item) drawLabel(ctx, 'REST', x, y, { size: 13, colour: '#8a6232' });
  else if (state.item.kind === 'bowl') drawBowl(ctx, state.item.contents, x, y, 34, { glow: 1 });
  else drawIngredient(ctx, state.item, x, y, 1.3);
}

function drawKnife(ctx, x, y, turn) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  ctx.beginPath();
  ctx.moveTo(-4, -26);
  ctx.lineTo(7, -22);
  ctx.lineTo(7, 6);
  ctx.lineTo(-4, 6);
  ctx.closePath();
  ctx.fillStyle = '#dfe6ea';
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#7e8a92';
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-3, 6, 8, 18, 3);
  ctx.fillStyle = '#2b1d16';
  ctx.fill();
  ctx.restore();
}

function drawBoard(ctx, station, state, service) {
  const { x, y } = station;
  const justChopped = Math.max(0, 1 - (service.clock - state.lastUsedAt) * 6);
  const nudge = state.item && nextStepOf(state.item) === 'chop' ? justChopped * 3 : 0;
  ctx.beginPath();
  ctx.roundRect(x - 50, y - 44 + nudge, 100, 88, 12);
  ctx.fillStyle = '#c98f55';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#8a5a2c';
  ctx.stroke();
  ctx.strokeStyle = '#b57c45';
  ctx.lineWidth = 1.5;
  for (const dy of [-22, -4, 16]) {
    ctx.beginPath();
    ctx.moveTo(x - 38, y + dy + nudge);
    ctx.quadraticCurveTo(x, y + dy + 5 + nudge, x + 38, y + dy + nudge);
    ctx.stroke();
  }
  if (state.item) {
    const chopping = nextStepOf(state.item) === 'chop';
    if (chopping && state.strokes > 0) drawHalfChopped(ctx, state.item, state.strokes, CHOP_STROKES, x - 4, y + nudge, 1.25);
    else drawIngredient(ctx, state.item, x - 4, y + nudge, 1.25);
    if (chopping) {
      for (let i = 0; i < CHOP_STROKES; i++) {
        ctx.beginPath();
        ctx.arc(x - 24 + i * 16, y + 34, 5, 0, Math.PI * 2);
        ctx.fillStyle = i < state.strokes ? '#ffd27a' : '#10222a';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#fdf6e3';
        ctx.stroke();
      }
    }
  }
  if (!(state.item && justChopped > 0)) drawKnife(ctx, x + 38, y + 4 + nudge, 0.12);
  drawLabel(ctx, 'CHOP', x, y - 56, { size: 12, colour: '#17555e' });
}

function drawCookRing(ctx, x, y, radius, progress) {
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#10222a';
  ctx.stroke();
  const done = progress >= 1;
  const share = done ? progress - 1 : progress;
  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.02, share));
  ctx.lineWidth = 6;
  ctx.strokeStyle = done ? (share > 0.6 ? '#ff5a3c' : '#ffb347') : '#7fe0c8';
  ctx.stroke();
  if (done) {
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2 + Math.PI * 2 * share, Math.PI * 1.5);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#8fd45a';
    ctx.stroke();
  }
}

function drawFlames(ctx, x, y, radius, clock) {
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    const lick = 6 + 4 * Math.sin(clock * 9 + i * 2.1);
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * radius, y + Math.sin(a) * radius, lick, 5, a, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 ? '#ff8a2a' : '#ffd24a';
    ctx.fill();
  }
}

function drawSteam(ctx, x, y, clock, strength) {
  for (let i = 0; i < 4; i++) {
    const rise = (clock * 0.6 + i * 0.25) % 1;
    ctx.beginPath();
    ctx.arc(x - 18 + i * 12 + Math.sin(clock * 2 + i) * 4, y - 14 - rise * 46, 7 + rise * 9, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,' + (0.34 * (1 - rise) * strength).toFixed(3) + ')';
    ctx.fill();
  }
}

function drawWok(ctx, station, state, service) {
  const { x, y } = station;
  const lit = state.item !== null;
  if (lit) drawFlames(ctx, x, y, 44, service.clock);
  ctx.beginPath();
  ctx.roundRect(x - 78, y - 7, 40, 14, 6);
  ctx.fillStyle = '#5f3d1f';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, 44, 0, Math.PI * 2);
  ctx.fillStyle = '#23262d';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#0d0f12';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 34, 0, Math.PI * 2);
  ctx.fillStyle = '#3a3f49';
  ctx.fill();
  if (state.item) {
    const sizzle = state.item.burnt ? 0 : Math.sin(service.clock * 30) * 1.2;
    drawIngredient(ctx, state.item, x + sizzle, y, 1.2);
    drawCookRing(ctx, x, y, 52, heatProgress(station, state));
    if (!state.item.burnt) drawSteam(ctx, x, y, service.clock, 0.6);
  }
  drawLabel(ctx, 'WOK · SEAR', x, y - 64, { size: 12, colour: '#17555e' });
}

function drawPot(ctx, station, state, service) {
  const { x, y } = station;
  if (state.item) drawFlames(ctx, x, y, 46, service.clock);
  ctx.fillStyle = '#6d7780';
  ctx.beginPath();
  ctx.roundRect(x - 62, y - 9, 124, 18, 8);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, 46, 0, Math.PI * 2);
  ctx.fillStyle = '#aeb8bf';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#59636b';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 37, 0, Math.PI * 2);
  ctx.fillStyle = state.item ? '#8fd0dc' : '#6fa9b6';
  ctx.fill();
  if (state.item) {
    drawIngredient(ctx, state.item, x, y, 1.25);
    for (let i = 0; i < 6; i++) {
      const a = i * 1.1 + service.clock * 0.8;
      const pop = (service.clock * 1.7 + i * 0.37) % 1;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * 24, y + Math.sin(a) * 24, 2 + pop * 4, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.9 - pop * 0.8).toFixed(2) + ')';
      ctx.stroke();
    }
    drawCookRing(ctx, x, y, 54, heatProgress(station, state));
    if (!state.item.burnt) drawSteam(ctx, x, y, service.clock, 1);
  }
  drawLabel(ctx, 'POT · BOIL', x, y - 66, { size: 12, colour: '#17555e' });
}

function drawPlate(ctx, station, state, service) {
  const { x, y } = station;
  ctx.beginPath();
  ctx.arc(x, y + 4, 54, 0, Math.PI * 2);
  ctx.fillStyle = '#d9b57f';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = '#a97c45';
  ctx.stroke();
  ctx.setLineDash([]);
  if (!state.bowl) {
    drawLabel(ctx, 'PLATE', x, y, { size: 13, colour: '#8a6232' });
    return;
  }
  const recipe = recipeMatching(state.bowl.contents);
  const glow = recipe ? 0.5 + 0.5 * Math.sin(service.clock * 5) : 0;
  drawBowl(ctx, state.bowl.contents, x, y + 4, 46, { glow });
  if (recipe) {
    drawTag(ctx, 'READY · ' + recipe.name.toUpperCase(), x, y - 62, { size: 11, fill: '#ffd27a', colour: '#3a2408', pad: 7, edge: '#b56a12' });
  } else {
    const count = state.bowl.contents.length;
    drawTag(ctx, count === 0 ? 'EMPTY BOWL' : 'ASSEMBLING · ' + count + ' IN', x, y - 62, { size: 11, fill: '#10222a', colour: '#bfeee6', pad: 7 });
  }
}

function drawPass(ctx, station, state, service) {
  const { x, y } = station;
  const glow = service.effects.passGlow;
  ctx.beginPath();
  ctx.roundRect(x - 112, y - 46, 224, 92, 10);
  ctx.fillStyle = '#10222a';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = glow > 0 ? '#ffe9a8' : '#c9803f';
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(x - 100, y - 34, 200, 68, 6);
  ctx.fillStyle = glow > 0 ? 'rgba(255, 214, 110, ' + (0.25 + 0.5 * glow).toFixed(2) + ')' : '#1f3a44';
  ctx.fill();
  drawLabel(ctx, 'THE PASS', x - 26, y - 12, { size: 20, colour: '#ffd27a', display: true });
  drawLabel(ctx, 'serve finished bowls here', x - 26, y + 12, { size: 11, colour: '#bfeee6', bold: false });
  // The brass bell.
  ctx.beginPath();
  ctx.arc(x + 72, y + 4, 16, Math.PI, 0);
  ctx.lineTo(x + 92, y + 8);
  ctx.lineTo(x + 52, y + 8);
  ctx.closePath();
  ctx.fillStyle = '#e0a93b';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#8a5a12';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 72, y - 14, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#8a5a12';
  ctx.fill();
}

function drawBin(ctx, station) {
  const { x, y } = station;
  ctx.beginPath();
  ctx.arc(x, y, 34, 0, Math.PI * 2);
  ctx.fillStyle = '#4b5a63';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#27323a';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.fillStyle = '#1b2329';
  ctx.fill();
  drawLabel(ctx, 'BIN', x, y, { size: 12, colour: '#9fb3c2' });
}

const DRAW_STATION = {
  crate: drawCrate,
  bowls: drawBowlStack,
  board: drawBoard,
  wok: drawWok,
  pot: drawPot,
  plate: drawPlate,
  shelf: drawShelf,
  pass: drawPass,
  bin: drawBin,
};

function drawReachRing(ctx, station, clock) {
  const pulse = 3 + Math.sin(clock * 8) * 2;
  ctx.beginPath();
  if (station.type === 'pass') ctx.roundRect(station.x - 118 - pulse, station.y - 52 - pulse, 236 + pulse * 2, 104 + pulse * 2, 14);
  else ctx.arc(station.x, station.y, 60 + pulse, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#fff3c4';
  ctx.stroke();
}

function drawUsePrompt(ctx, service, station) {
  const words = promptFor(service, station);
  if (!words) return;
  const stand = nearestStand(station, service.chef.x, service.chef.y);
  const sideways = Math.abs(stand.x - station.x) > Math.abs(stand.y - station.y);
  const x = sideways ? station.x + Math.sign(stand.x - station.x) * 150 : station.x;
  const y = sideways ? station.y - 58 : station.y + Math.sign(stand.y - station.y) * (station.type === 'plate' ? 150 : 132);
  drawTag(ctx, 'SPACE  ' + words, x, y, { size: 14, fill: '#fff3c4', colour: '#2b1d16', pad: 10, edge: '#c9803f' });
}

/** Draws the whole kitchen. `inReach` is the station the chef could use now, ringed and prompted. */
export function drawKitchen(ctx, service, inReach) {
  drawDeck(ctx);
  drawCounters(ctx);
  drawIsland(ctx);
  for (const station of STATIONS) DRAW_STATION[station.type](ctx, station, service.stations[station.id], service);
  drawLanternString(ctx, service.clock, service.rushHour);
  if (inReach) drawReachRing(ctx, inReach, service.clock);
}

export function drawKitchenPrompt(ctx, service, inReach) {
  if (inReach) drawUsePrompt(ctx, service, inReach);
}
