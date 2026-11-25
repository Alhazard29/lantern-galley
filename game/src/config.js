// Tuning numbers for one dinner service on the Lantern Galley. Nothing here draws or decides.

export const SCREEN = { width: 1280, height: 720 };

export const SERVICE_SECONDS = 180;

export const CHEF = {
  radius: 26,
  speed: 330, // pixels a second
  reach: 96, // how far from a station's standing spot the chef can still use it
};

// The floor the chef walks on: stations sit on the counters around it.
export const FLOOR = { left: 410, right: 1134, top: 226, bottom: 574 };

export const CHOP_STROKES = 4;

export const COOK = {
  boilSeconds: 7,
  searSeconds: 5,
  burnAfterSeconds: 9, // extra seconds on the heat before a done item burns
};

export const TICKETS = {
  maxOpen: 5,
  firstAfterSeconds: 1.5,
  calmEverySeconds: 15,
  rushEverySeconds: 7,
  calmPatienceSeconds: 75,
  rushPatienceSeconds: 48,
};

export const RUSH = {
  startsAtFraction: 0.55, // of the service gone
  bannerSeconds: 3,
};

export const TIPS = {
  speedBonus: 24, // paid in full for an instant serve, nothing at the last second
  streakStep: 0.25, // each serve in a row adds a quarter to the multiplier
  streakCap: 3,
  missedPenalty: 15,
  threeLanterns: 520,
  twoLanterns: 300,
};
