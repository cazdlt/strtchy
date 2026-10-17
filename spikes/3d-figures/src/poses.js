// Every illustrated movement. Each group file exports MOVEMENTS; `seed` is the
// movement's name in src/lib/seed/data.json (the app's built-in library).
import { CORE } from './poses/core.js';
import { MOVEMENTS as STANDING } from './poses/standing.js';
import { MOVEMENTS as WALL } from './poses/wall.js';
import { MOVEMENTS as SUPINE } from './poses/supine.js';
import { MOVEMENTS as PRONE } from './poses/prone.js';
import { MOVEMENTS as SEATED } from './poses/seated.js';

export const MOVEMENTS = [...CORE, ...STANDING, ...WALL, ...SUPINE, ...PRONE, ...SEATED];
