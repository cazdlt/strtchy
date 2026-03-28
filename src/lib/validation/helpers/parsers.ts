import { z } from 'zod';

export const validImageTypes = ['image/svg+xml', 'image/jpeg', 'image/png', 'image/webp'];

export const imageFileSchema = z.instanceof(File).refine(
	(file) => file.size === 0 || validImageTypes.includes(file.type),
	'Invalid image type. Allowed: SVG, JPG, PNG, WebP'
);

export function equipmentParser(equipmentRaw: string | null): string[] {
	if (!equipmentRaw || typeof equipmentRaw !== 'string') return [];
	return equipmentRaw.split(',').map(e => e.trim()).filter(Boolean);
}

export function checkboxParser(value: FormDataEntryValue | null): boolean {
	return value === 'true' || value === 'on';
}

export function movementsDataParser(jsonString: string) {
	try {
		return JSON.parse(jsonString);
	} catch {
		throw new Error('Invalid movements data JSON');
	}
}

export function getTargetTypeMap() {
	return {
		timed: 'time' as const,
		reps: 'reps' as const,
		weighted: 'reps' as const,
		resistance_band: 'reps' as const
	};
}
