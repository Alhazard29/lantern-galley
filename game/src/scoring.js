// Tips: what a served bowl pays, what a walked-out ticket costs, and the lantern
// rating on the end-of-service summary.

import { TIPS } from './config.js';

export function newScore() {
  return { tips: 0, served: 0, missed: 0, binned: 0, streak: 0, bestStreak: 0 };
}

export function streakMultiplier(streak) {
  return Math.min(TIPS.streakCap, 1 + streak * TIPS.streakStep);
}

/** Pays a served ticket into the score and returns the tip, for the pop-up over the pass. */
export function payServedTicket(score, ticket) {
  const freshness = Math.max(0, ticket.patienceLeft / ticket.patience);
  const multiplier = streakMultiplier(score.streak);
  const tip = Math.round((ticket.recipe.price + TIPS.speedBonus * freshness) * multiplier);
  score.tips += tip;
  score.served += 1;
  score.streak += 1;
  score.bestStreak = Math.max(score.bestStreak, score.streak);
  return { tip, multiplier };
}

export function chargeMissedTicket(score) {
  score.tips = Math.max(0, score.tips - TIPS.missedPenalty);
  score.missed += 1;
  score.streak = 0;
}

export function lanternRating(score) {
  if (score.tips >= TIPS.threeLanterns) return 3;
  if (score.tips >= TIPS.twoLanterns) return 2;
  return score.served > 0 ? 1 : 0;
}

export function ratingWords(lanterns) {
  return ['The galley went dark', 'A quiet night on the water', 'The canal is talking', 'Every lantern lit!'][lanterns];
}
