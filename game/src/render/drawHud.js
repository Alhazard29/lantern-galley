// The strip across the top: the galley's name, the service clock you can feel run
// down, tips, bowls served, the streak, and the rush-hour banner.

import { SCREEN, SERVICE_SECONDS } from '../config.js';
import { streakMultiplier } from '../scoring.js';
import { secondsLeft } from '../service.js';
import { drawLabel, drawTag } from './drawText.js';

function clockWords(seconds) {
  const whole = Math.ceil(seconds);
  return Math.floor(whole / 60) + ':' + String(whole % 60).padStart(2, '0');
}

function drawServiceClock(ctx, service) {
  const left = secondsLeft(service);
  const share = left / SERVICE_SECONDS;
  const lastCall = left <= 20;
  const beat = lastCall ? 1 + 0.06 * Math.abs(Math.sin(service.clock * Math.PI * 2)) : 1;
  const x = 640;
  ctx.beginPath();
  ctx.roundRect(x - 150, 8, 300, 48, 12);
  ctx.fillStyle = lastCall ? '#5a1810' : '#132329';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = lastCall ? '#ff5a3c' : '#c9803f';
  ctx.stroke();
  ctx.save();
  ctx.translate(x - 108, 33);
  ctx.scale(beat, beat);
  drawLabel(ctx, clockWords(left), 0, 0, { size: 28, colour: lastCall ? '#ff8a6b' : '#fff3c4', display: true });
  ctx.restore();
  // The clock as a burning-down bar: you can see how much evening is left without reading.
  drawLabel(ctx, service.rushHour ? 'RUSH HOUR' : 'DINNER SERVICE', x - 54, 19, { size: 10, colour: service.rushHour ? '#ff8a6b' : '#bfeee6', align: 'left' });
  ctx.beginPath();
  ctx.roundRect(x - 56, 28, 192, 18, 7);
  ctx.fillStyle = '#0c181d';
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x - 53, 31, Math.max(8, 186 * share), 12, 5);
  ctx.fillStyle = lastCall ? '#ff5a3c' : service.rushHour ? '#ff8a2a' : '#ffb347';
  ctx.fill();
}

export function drawHud(ctx, service) {
  ctx.fillStyle = '#0c181d';
  ctx.fillRect(0, 0, SCREEN.width, 64);
  ctx.fillStyle = '#c9803f';
  ctx.fillRect(0, 62, SCREEN.width, 2);

  drawLabel(ctx, 'LANTERN GALLEY', 16, 26, { size: 24, colour: '#ffb347', align: 'left', display: true });
  drawLabel(ctx, 'night kitchen on the canal', 18, 48, { size: 12, colour: '#7fe0c8', align: 'left', bold: false });

  drawServiceClock(ctx, service);

  const score = service.score;
  drawLabel(ctx, 'TIPS', 870, 20, { size: 11, colour: '#bfeee6', align: 'left' });
  drawLabel(ctx, String(score.tips), 870, 42, { size: 24, colour: '#ffd27a', align: 'left', display: true });
  drawLabel(ctx, 'SERVED', 980, 20, { size: 11, colour: '#bfeee6', align: 'left' });
  drawLabel(ctx, String(score.served), 980, 42, { size: 24, colour: '#fdf6e3', align: 'left', display: true });
  drawLabel(ctx, 'MISSED', 1076, 20, { size: 11, colour: '#bfeee6', align: 'left' });
  drawLabel(ctx, String(score.missed), 1076, 42, { size: 24, colour: score.missed ? '#ff8a6b' : '#fdf6e3', align: 'left', display: true });
  drawLabel(ctx, 'STREAK', 1170, 20, { size: 11, colour: '#bfeee6', align: 'left' });
  const multiplier = streakMultiplier(score.streak);
  drawLabel(ctx, '×' + multiplier.toFixed(2).replace(/0$/, ''), 1170, 42, { size: 24, colour: multiplier > 1 ? '#7fe0c8' : '#fdf6e3', align: 'left', display: true });
}

/** The banner that drops when rush hour starts. */
export function drawRushBanner(ctx, service) {
  if (service.rushBannerLeft <= 0) return;
  const drop = Math.min(1, (3 - service.rushBannerLeft) * 5, service.rushBannerLeft * 3);
  const top = 212 - 40 * (1 - drop);
  ctx.save();
  ctx.globalAlpha = drop;
  ctx.beginPath();
  ctx.roundRect(520, top, 500, 92, 16);
  ctx.fillStyle = '#c0291a';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffd27a';
  ctx.stroke();
  drawLabel(ctx, 'RUSH HOUR', 770, top + 36, { size: 40, colour: '#fff3c4', display: true });
  drawLabel(ctx, 'tickets come faster · the Captain\'s Feast is on the menu', 770, top + 70, { size: 14, colour: '#ffe3da', bold: false });
  ctx.restore();
}

export function drawControlsHint(ctx, muted) {
  drawTag(ctx, 'WASD / arrows move · SPACE use · click a station to walk there · P pause · M ' + (muted ? 'unmute' : 'mute'), 772, 218, {
    size: 11, fill: 'rgba(12,24,29,0.7)', colour: '#bfeee6', pad: 7,
  });
}
