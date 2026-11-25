// The order board down the left side: one paper ticket per open order, with the dish,
// what goes in it, what is already plated, and a patience bar that drains to red.

import { SCREEN, TICKETS } from '../config.js';
import { ticketProgress } from '../orders.js';
import { INGREDIENTS, INGREDIENT_ORDER } from '../recipes.js';
import { drawBowl, drawIngredientStage } from './drawFood.js';
import { drawLabel } from './drawText.js';

const BOARD = { x: 0, y: 64, w: 264 };
const TICKET = { x: 12, w: 240, h: 94, gap: 6, top: 110 };

function patienceColour(share) {
  if (share > 0.5) return '#5fbf5a';
  if (share > 0.25) return '#f2a93b';
  return '#e8452f';
}

function drawTick(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#2f9e44';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 3.5, y);
  ctx.lineTo(x - 1, y + 3);
  ctx.lineTo(x + 4, y - 3);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
}

function drawTicket(ctx, ticket, y, plated, clock) {
  const share = Math.max(0, ticket.patienceLeft / ticket.patience);
  const urgent = share <= 0.25;
  const slideIn = Math.max(0, 1 - ticket.age * 4);
  const x = TICKET.x - slideIn * 260 + (urgent ? Math.sin(clock * 40) * 2 : 0);

  ctx.beginPath();
  ctx.roundRect(x, y, TICKET.w, TICKET.h, 8);
  ctx.fillStyle = urgent ? '#ffe3da' : '#fdf6e3';
  ctx.fill();
  ctx.lineWidth = urgent ? 3 : 1.5;
  ctx.strokeStyle = urgent ? '#e8452f' : '#d8c8a2';
  ctx.stroke();

  drawBowl(ctx, ticket.recipe.needs, x + 40, y + 46, 30);
  drawLabel(ctx, ticket.recipe.name, x + 80, y + 18, { size: 15, colour: '#2b1d16', align: 'left', display: true });

  ticket.recipe.needs.forEach((id, i) => {
    const cx = x + 96 + i * 38;
    const cy = y + 52;
    ctx.beginPath();
    ctx.roundRect(cx - 17, cy - 17, 34, 34, 7);
    ctx.fillStyle = plated.includes(id) ? '#d5f0c9' : '#efe2c4';
    ctx.fill();
    drawIngredientStage(ctx, id, 'ready', cx, cy, 0.62);
    if (plated.includes(id)) drawTick(ctx, cx + 12, cy - 12);
  });

  ctx.beginPath();
  ctx.roundRect(x + 8, y + TICKET.h - 16, TICKET.w - 16, 9, 4);
  ctx.fillStyle = '#d8c8a2';
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x + 8, y + TICKET.h - 16, Math.max(6, (TICKET.w - 16) * share), 9, 4);
  ctx.fillStyle = patienceColour(share);
  ctx.fill();
}

const PREP_WORDS = { chop: 'chop', boil: 'boil', sear: 'sear' };

function drawPrepGuide(ctx) {
  const top = SCREEN.height - 104;
  ctx.fillStyle = '#0c181d';
  ctx.fillRect(BOARD.x, top, BOARD.w, 104);
  drawLabel(ctx, 'PREP GUIDE', 14, top + 13, { size: 11, colour: '#7fe0c8', align: 'left' });
  INGREDIENT_ORDER.forEach((id, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 26 + col * 128;
    const y = top + 38 + row * 26;
    drawIngredientStage(ctx, id, 'raw', x, y, 0.5);
    const steps = INGREDIENTS[id].steps.map((step) => PREP_WORDS[step]).join(' › ');
    drawLabel(ctx, steps, x + 18, y + 1, { size: 12, colour: '#fdf6e3', align: 'left', bold: false });
  });
}

/** Draws the board and every open ticket. `bowls` are the bowls on the plating counter and in hand. */
export function drawOrderBoard(ctx, service, bowls) {
  ctx.fillStyle = '#132329';
  ctx.fillRect(BOARD.x, BOARD.y, BOARD.w, SCREEN.height - BOARD.y);
  ctx.fillStyle = '#c9803f';
  ctx.fillRect(BOARD.w - 4, BOARD.y, 4, SCREEN.height - BOARD.y);
  drawLabel(ctx, 'ORDERS', 14, 88, { size: 20, colour: '#ffd27a', align: 'left', display: true });
  const tickets = service.orders.tickets;
  drawLabel(ctx, tickets.length + ' / ' + TICKETS.maxOpen + ' open', BOARD.w - 16, 89, { size: 12, colour: tickets.length >= 4 ? '#ff8a6b' : '#bfeee6', align: 'right' });
  tickets.forEach((ticket, i) => {
    drawTicket(ctx, ticket, TICKET.top + i * (TICKET.h + TICKET.gap), ticketProgress(ticket, bowls), service.clock);
  });
  if (tickets.length === 0) {
    drawLabel(ctx, 'No tickets yet…', BOARD.w / 2, 170, { size: 14, colour: '#5f7a82', bold: false });
  }
  if (service.effects.alarm > 0) {
    ctx.fillStyle = 'rgba(232, 69, 47, ' + (service.effects.alarm * 0.35).toFixed(2) + ')';
    ctx.fillRect(BOARD.x, BOARD.y, BOARD.w, SCREEN.height - BOARD.y);
  }
  drawPrepGuide(ctx);
}
