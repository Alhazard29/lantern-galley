// Hands the game in: copies game/ and screenshots/ from this repository into the
// output directory and writes dossier.json there with the kit's own buildDossier.
// Standard library only, no network; two runs write the same bytes.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const REPOSITORY = dirname(fileURLToPath(import.meta.url));
const OUTPUT = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The bounty's gate: the same caps its scorer hands buildDossier.
const GATE = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
};

/** Copies one directory of the repository into the output, replacing what an earlier run left. */
function handInDirectory(name: string): void {
  const from = join(REPOSITORY, name);
  const to = join(OUTPUT, name);
  if (!existsSync(from)) throw new Error(`main.ts: ${name}/ is missing from the repository at ${from}`);
  if (existsSync(to)) rmSync(to, { recursive: true, force: true });
  // Skip dotfiles (.DS_Store and the like): only the game's own files are handed in.
  cpSync(from, to, { recursive: true, filter: (source) => !source.split(/[\\/]/).pop()!.startsWith('.') });
}

mkdirSync(OUTPUT, { recursive: true });
handInDirectory('game');
handInDirectory('screenshots');
writeFileSync(join(OUTPUT, 'dossier.json'), buildDossier(OUTPUT, GATE));

const shots = readdirSync(join(OUTPUT, 'screenshots')).length;
console.log(`Lantern Galley handed in to ${OUTPUT}: game/, ${shots} screenshots, dossier.json`);
