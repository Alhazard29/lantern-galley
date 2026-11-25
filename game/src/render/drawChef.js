// The chef from above: apron, headscarf, two hands, and whatever they are carrying.

import { CHEF } from '../config.js';
import { describeItem } from '../recipes.js';
import { drawBowl, drawIngredient } from './drawFood.js';
import { drawTag } from './drawText.js';

function drawHeldItem(ctx, item, x, y) {
  if (item.kind === 'bowl') drawBowl(ctx, item.contents, x, y, 30, { glow: 1 });
  else drawIngredient(ctx, item, x, y, 1.05);
}

export function drawChef(ctx, chef, clock) {
  const bob = chef.moving ? Math.sin(chef.stride) * 2.5 : 0;
  const reach = 30 + chef.swing * 10;
  ctx.save();
  ctx.translate(chef.x, chef.y);
  ctx.scale(1.2, 1.2);

  ctx.beginPath();
  ctx.ellipse(4, 8, CHEF.radius + 4, CHEF.radius, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();

  ctx.save();
  ctx.rotate(chef.facing);
  // Feet, stepping as the chef walks.
  ctx.fillStyle = '#2b1d16';
  ctx.beginPath();
  ctx.ellipse(-4 + bob * 2, -13, 9, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(-4 - bob * 2, 13, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body and apron.
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, CHEF.radius, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#e8573a';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#8f2a18';
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(5, 0, 13, 18, 0, -Math.PI / 2, Math.PI / 2);
  ctx.fillStyle = '#fdf6e3';
  ctx.fill();
  // Arms and hands.
  ctx.lineCap = 'round';
  ctx.lineWidth = 9;
  ctx.strokeStyle = '#e8573a';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(4, side * 20);
    ctx.lineTo(reach - 8, side * 13);
    ctx.stroke();
  }
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(reach - 6, side * 12, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f2c79a';
    ctx.fill();
  }
  // Head and headscarf with its knot.
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fillStyle = '#f2c79a';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-1, 0, 14.5, Math.PI * 0.42, Math.PI * 1.58);
  ctx.closePath();
  ctx.fillStyle = '#1c6f78';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-15, 0, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffb347';
  ctx.fill();
  ctx.fillStyle = '#2b1d16';
  ctx.beginPath();
  ctx.arc(8, -5, 1.8, 0, Math.PI * 2);
  ctx.arc(8, 5, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (chef.holding) {
    const hx = Math.cos(chef.facing) * (reach + 12);
    const hy = Math.sin(chef.facing) * (reach + 12);
    drawHeldItem(ctx, chef.holding, hx, hy);
  }
  ctx.restore();

  if (chef.holding) {
    drawTag(ctx, describeItem(chef.holding), chef.x, chef.y - 52, { size: 12, fill: 'rgba(16,34,42,0.88)', colour: '#fdf6e3', pad: 7 });
  }
}
