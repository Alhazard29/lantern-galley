// The order board: tickets arrive, tick down and walk out, and a finished bowl is
// matched to the ticket that has waited longest for that dish.

import { TICKETS } from './config.js';
import { RECIPES, recipeMatching } from './recipes.js';
import { isRushHour, secondsBetweenTickets, ticketPatience } from './rush.js';
import { chargeMissedTicket, payServedTicket } from './scoring.js';

export function newOrderBoard() {
  return { tickets: [], nextTicketIn: TICKETS.firstAfterSeconds, ticketsPrinted: 0 };
}

function pickRecipe(service) {
  const menu = RECIPES.filter((recipe) => !recipe.fromRush || isRushHour(service.clock));
  // Do not print the same dish three times in a row: the board should make you plan.
  const open = service.orders.tickets.map((ticket) => ticket.recipe.id);
  const fresh = menu.filter((recipe) => open.filter((id) => id === recipe.id).length < 2);
  const pool = fresh.length > 0 ? fresh : menu;
  return pool[Math.floor(service.random() * pool.length)];
}

export function printTicket(service, recipe = pickRecipe(service)) {
  const patience = ticketPatience(service.clock);
  const ticket = {
    number: ++service.orders.ticketsPrinted,
    recipe,
    patience,
    patienceLeft: patience,
    age: 0,
  };
  service.orders.tickets.push(ticket);
  service.events.push({ type: 'ticketPrinted', ticket });
  return ticket;
}

export function updateOrderBoard(service, dt) {
  const board = service.orders;
  board.nextTicketIn -= dt;
  if (board.nextTicketIn <= 0 && board.tickets.length < TICKETS.maxOpen) {
    printTicket(service);
    board.nextTicketIn = secondsBetweenTickets(service.clock);
  }
  for (const ticket of board.tickets) {
    ticket.patienceLeft -= dt;
    ticket.age += dt;
  }
  const walkedOut = board.tickets.filter((ticket) => ticket.patienceLeft <= 0);
  for (const ticket of walkedOut) {
    chargeMissedTicket(service.score);
    service.events.push({ type: 'ticketMissed', ticket });
  }
  board.tickets = board.tickets.filter((ticket) => ticket.patienceLeft > 0);
}

/** The open ticket a bowl would answer, the most impatient first, or null. */
export function ticketWaitingFor(service, bowl) {
  const recipe = recipeMatching(bowl.contents);
  if (!recipe) return null;
  const waiting = service.orders.tickets.filter((ticket) => ticket.recipe.id === recipe.id);
  waiting.sort((a, b) => a.patienceLeft - b.patienceLeft);
  return waiting[0] ?? null;
}

/** Sends a bowl through the pass. Returns the tip paid, or null when no ticket wants it. */
export function serveBowl(service, bowl) {
  const ticket = ticketWaitingFor(service, bowl);
  if (!ticket) return null;
  service.orders.tickets = service.orders.tickets.filter((open) => open !== ticket);
  const paid = payServedTicket(service.score, ticket);
  service.events.push({ type: 'served', ticket, tip: paid.tip, multiplier: paid.multiplier });
  return paid;
}

/** Which of a ticket's ingredients some bowl on the plating counter already holds, for the board's ticks. */
export function ticketProgress(ticket, bowls) {
  let best = [];
  for (const bowl of bowls) {
    const fits = bowl.contents.every((id) => ticket.recipe.needs.includes(id));
    if (fits && bowl.contents.length > best.length) best = bowl.contents;
  }
  return best;
}
