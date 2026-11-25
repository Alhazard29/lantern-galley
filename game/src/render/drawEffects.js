// Draws what feedback.js keeps: flying bits, expanding rings and the words that
// float up from a chop, a plated bowl or a served ticket.

import { drawLabel } from './drawText.js';

export function drawEffects(ctx, effects) {
  for (const ring of effects.rings) {
    const t = ring.age / ring.life;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, 30 + t * 50, 0, Math.PI * 2);
    ctx.lineWidth = 6 * (1 - t);
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = ring.colour;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const p of effects.particles) {
    const t = p.age / p.life;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.spin + p.age * 9);
    ctx.globalAlpha = 1 - t * t;
    ctx.fillStyle = p.colour;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
    ctx.restore();
  }
  for (const popup of effects.popups) {
    const t = popup.age / popup.life;
    ctx.globalAlpha = t < 0.75 ? 1 : 1 - (t - 0.75) * 4;
    const pop = t < 0.12 ? 0.6 + (t / 0.12) * 0.4 : 1;
    drawLabel(ctx, popup.text, popup.x, popup.y - t * 34, { size: popup.size * pop, colour: popup.colour, outline: '#10222a', display: popup.size >= 24 });
  }
  ctx.globalAlpha = 1;
}

/** How far to jolt the whole picture this frame, from the shake left in the effects. */
export function shakeOffset(effects, clock) {
  const power = Math.min(1, effects.shake * 4) * 5;
  return { x: Math.sin(clock * 91) * power, y: Math.cos(clock * 77) * power };
}
