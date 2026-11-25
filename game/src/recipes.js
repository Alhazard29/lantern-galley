// The pantry and the menu: what each ingredient needs before it may go in a bowl,
// and which bowls the galley sells. Recipes share ingredients on purpose, so one
// chopped pile of greens can save two tickets if you route it well.

export const INGREDIENTS = {
  noodles: { name: 'Rope noodles', steps: ['boil'] },
  mushroom: { name: 'Dock mushroom', steps: ['chop', 'sear'] },
  greens: { name: 'Canal greens', steps: ['chop'] },
  egg: { name: 'Gull egg', steps: ['sear'] },
  prawn: { name: 'Tide prawn', steps: ['sear'] },
  chili: { name: 'Ember chili', steps: ['chop'] },
};

export const INGREDIENT_ORDER = ['noodles', 'mushroom', 'greens', 'egg', 'prawn', 'chili'];

export const RECIPES = [
  { id: 'lanternBowl', name: 'Lantern Bowl', needs: ['noodles', 'greens', 'egg'], price: 30, fromRush: false },
  { id: 'wharfToss', name: 'Wharf Toss', needs: ['mushroom', 'greens', 'prawn'], price: 38, fromRush: false },
  { id: 'goldenNest', name: 'Golden Nest', needs: ['noodles', 'mushroom', 'egg'], price: 36, fromRush: false },
  { id: 'emberPrawns', name: 'Ember Prawns', needs: ['noodles', 'prawn', 'chili'], price: 34, fromRush: false },
  { id: 'gardenScramble', name: 'Garden Scramble', needs: ['egg', 'greens', 'chili'], price: 28, fromRush: false },
  { id: 'captainsFeast', name: "Captain's Feast", needs: ['noodles', 'mushroom', 'prawn', 'egg'], price: 60, fromRush: true },
];

export function makeIngredient(id) {
  return { kind: 'ingredient', id, stepsDone: 0, burnt: false };
}

export function makeBowl(contents = []) {
  return { kind: 'bowl', contents: [...contents] };
}

/** The step an ingredient still needs ('chop', 'boil', 'sear'), or null once it is ready for a bowl. */
export function nextStepOf(item) {
  if (!item || item.kind !== 'ingredient' || item.burnt) return null;
  return INGREDIENTS[item.id].steps[item.stepsDone] ?? null;
}

export function isReadyForBowl(item) {
  return !!item && item.kind === 'ingredient' && !item.burnt && nextStepOf(item) === null;
}

function sameSet(a, b) {
  return a.length === b.length && a.every((x) => b.includes(x));
}

/** The recipe a bowl's contents complete, or null while it is still mid-assembly. */
export function recipeMatching(contents) {
  return RECIPES.find((recipe) => sameSet(recipe.needs, contents)) ?? null;
}

/** True when some recipe still has room for this ingredient next to what the bowl already holds. */
export function bowlCanTake(contents, ingredientId) {
  if (contents.includes(ingredientId)) return false;
  const next = [...contents, ingredientId];
  return RECIPES.some((recipe) => next.every((x) => recipe.needs.includes(x)));
}

/** Word for the state an ingredient is in, for labels and hints. */
export function describeItem(item) {
  if (!item) return '';
  if (item.kind === 'bowl') {
    const recipe = recipeMatching(item.contents);
    if (recipe) return recipe.name;
    return item.contents.length === 0 ? 'Empty bowl' : 'Bowl ' + item.contents.length + ' in';
  }
  const name = INGREDIENTS[item.id].name;
  if (item.burnt) return 'Burnt ' + name.toLowerCase();
  const step = nextStepOf(item);
  return step ? name + ' · needs ' + step : name + ' · ready';
}
