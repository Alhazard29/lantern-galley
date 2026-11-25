// The screens around a service: the start card with how a bowl gets made and tonight's
// menu, the pause veil, and the end-of-service summary with its lantern rating.

import { SCREEN } from '../config.js';
import { INGREDIENTS, RECIPES } from '../recipes.js';
import { lanternRating, ratingWords } from '../scoring.js';
import { drawBowl, drawIngredientStage } from './drawFood.js';
import { drawLabel, drawTag } from './drawText.js';

function drawVeil(ctx, strength) {
  ctx.fillStyle = 'rgba(8, 16, 20, ' + strength + ')';
  ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);
}

function drawCard(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 20);
  ctx.fillStyle = '#132329';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#c9803f';
  ctx.stroke();
}

function drawBigLantern(ctx, x, y, lit) {
  if (lit) {
    ctx.beginPath();
    ctx.arc(x, y, 46, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 190, 90, 0.22)';
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(x, y, 24, 30, 0, 0, Math.PI * 2);
  ctx.fillStyle = lit ? '#ffb347' : '#2a3d45';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = lit ? '#b56a12' : '#41575f';
  ctx.stroke();
  ctx.fillStyle = lit ? '#2b1d16' : '#41575f';
  ctx.fillRect(x - 11, y - 36, 22, 8);
  ctx.fillRect(x - 11, y + 28, 22, 8);
}

const HOW_TO = [
  { title: '1 · Take', words: 'from a pantry crate', draw: (ctx, x, y) => drawIngredientStage(ctx, 'greens', 'raw', x, y, 1.3) },
  { title: '2 · Prep', words: 'chop, boil or sear', draw: (ctx, x, y) => drawIngredientStage(ctx, 'greens', 'ready', x, y, 1.3) },
  { title: '3 · Plate', words: 'build it in a bowl', draw: (ctx, x, y) => drawBowl(ctx, ['noodles', 'greens'], x, y, 30) },
  { title: '4 · Serve', words: 'carry it to the pass', draw: (ctx, x, y) => drawBowl(ctx, ['noodles', 'greens', 'egg'], x, y, 30, { glow: 1 }) },
];

export function drawStartScreen(ctx, clock) {
  drawVeil(ctx, 0.78);
  drawCard(ctx, 170, 60, 940, 600);
  drawLabel(ctx, 'LANTERN GALLEY', 640, 120, { size: 58, colour: '#ffb347', display: true });
  drawLabel(ctx, 'One chef, one barge kitchen, three minutes of dinner service on the canal.', 640, 166, { size: 16, colour: '#bfeee6', bold: false });

  HOW_TO.forEach((step, i) => {
    const x = 290 + i * 234;
    ctx.beginPath();
    ctx.roundRect(x - 100, 196, 200, 128, 12);
    ctx.fillStyle = '#1f3a44';
    ctx.fill();
    step.draw(ctx, x, 244);
    drawLabel(ctx, step.title, x, 290, { size: 16, colour: '#ffd27a' });
    drawLabel(ctx, step.words, x, 310, { size: 12, colour: '#fdf6e3', bold: false });
  });

  drawLabel(ctx, "TONIGHT'S MENU  ·  recipes share ingredients, so plan your route", 640, 354, { size: 13, colour: '#7fe0c8' });
  RECIPES.forEach((recipe, i) => {
    const x = 262 + i * 151;
    drawBowl(ctx, recipe.needs, x, 412, 38);
    drawLabel(ctx, recipe.name, x, 466, { size: 13, colour: '#fdf6e3' });
    const words = recipe.needs.map((id) => INGREDIENTS[id].name.split(' ')[1]).join(' + ');
    drawLabel(ctx, words, x, 484, { size: 9.5, colour: '#9fb3c2', bold: false });
    if (recipe.fromRush) drawTag(ctx, 'RUSH ONLY', x, 364 + 14, { size: 9, fill: '#c0291a', colour: '#fff3c4', pad: 5 });
  });

  drawLabel(ctx, 'WASD or arrows to walk  ·  SPACE to use the station you stand at  ·  or click any station', 640, 528, { size: 14, colour: '#fdf6e3', bold: false });
  drawLabel(ctx, 'Serve fast for bigger tips, serve in a row for a streak, and never let the wok burn.', 640, 552, { size: 14, colour: '#fdf6e3', bold: false });
  const pulse = 0.75 + 0.25 * Math.sin(clock * 4);
  ctx.globalAlpha = pulse;
  drawTag(ctx, 'PRESS SPACE OR CLICK TO OPEN THE GALLEY', 640, 610, { size: 20, fill: '#ffb347', colour: '#2b1d16', pad: 16 });
  ctx.globalAlpha = 1;
}

export function drawPauseVeil(ctx) {
  drawVeil(ctx, 0.6);
  drawLabel(ctx, 'PAUSED', 640, 340, { size: 56, colour: '#ffb347', display: true });
  drawLabel(ctx, 'press P to pick the knife back up', 640, 390, { size: 16, colour: '#bfeee6', bold: false });
}

export function drawServiceSummary(ctx, score, clock) {
  drawVeil(ctx, 0.72);
  drawCard(ctx, 300, 96, 680, 528);
  drawLabel(ctx, 'SERVICE CLOSED', 640, 150, { size: 44, colour: '#ffb347', display: true });
  const lanterns = lanternRating(score);
  for (let i = 0; i < 3; i++) drawBigLantern(ctx, 540 + i * 100, 236, i < lanterns);
  drawLabel(ctx, ratingWords(lanterns), 640, 306, { size: 20, colour: '#fff3c4', display: true });

  const rows = [
    ['Tips earned', String(score.tips), '#ffd27a'],
    ['Bowls served', String(score.served), '#fdf6e3'],
    ['Tickets walked out', String(score.missed), score.missed ? '#ff8a6b' : '#fdf6e3'],
    ['Best streak', score.bestStreak + ' in a row', '#7fe0c8'],
    ['Binned', String(score.binned), '#9fb3c2'],
  ];
  rows.forEach(([name, value, colour], i) => {
    const y = 356 + i * 38;
    ctx.fillStyle = i % 2 ? '#132329' : '#1a2f37';
    ctx.fillRect(380, y - 18, 520, 36);
    drawLabel(ctx, name, 400, y, { size: 17, colour: '#bfeee6', align: 'left', bold: false });
    drawLabel(ctx, value, 880, y, { size: 21, colour, align: 'right', display: true });
  });
  ctx.globalAlpha = 0.75 + 0.25 * Math.sin(clock * 4);
  drawTag(ctx, 'PRESS SPACE TO RUN ANOTHER SERVICE', 640, 580, { size: 18, fill: '#ffb347', colour: '#2b1d16', pad: 14 });
  ctx.globalAlpha = 1;
}
