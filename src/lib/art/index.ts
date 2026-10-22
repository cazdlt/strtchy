// 3D movement art and routine covers, rendered by spikes/3d-figures/export-app.mjs.
// Built-in movements are matched by canonical name or alias (including legacy
// Spanish names and IDs), so existing databases pick the art up seamlessly.
import manifest from './manifest.json';
import { resolveCanonicalMovementName } from './aliases';

export * from './aliases';

export interface MovementArt {
	/** Transparent webp still. */
	icon: string;
	/** Looping mp4 on the dark theme background (#151515). */
	dark: string;
	/** Looping mp4 on the light theme background (#f5f1ea). */
	light: string;
}

export interface MovementRef {
	name?: string | null;
	id?: string | null;
	movementId?: string | null;
	isCustom?: boolean | null;
	illustrationPath?: string | null;
}

const movements = manifest.movements as Record<string, MovementArt>;
const routines = manifest.routines as Record<string, string>;
const plates = manifest.plates as string[];

export function movementArt(m: MovementRef | null | undefined): MovementArt | null {
	if (!m || m.isCustom) return null;
	if (m.name && movements[m.name]) return movements[m.name];
	const canonical = resolveCanonicalMovementName(m);
	if (canonical && movements[canonical]) return movements[canonical];
	return null;
}

/** Best still image for a movement: 3D art for built-ins, else the stored illustration. */
export function movementImage(m: MovementRef | null | undefined): string | null {
	if (!m) return null;
	return movementArt(m)?.icon ?? m.illustrationPath ?? null;
}

/** Cover photo for a routine: a staged shot for built-ins, a calm backdrop otherwise. */
export function routineCover(r: { id: string; name: string; isCustom?: boolean | null }): string | null {
	if (!r.isCustom && routines[r.name]) return routines[r.name];
	if (!plates.length) return null;
	let h = 0;
	for (const c of r.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
	return plates[h % plates.length];
}
