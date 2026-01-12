import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { movements } from '$lib/db/schema';
import { nanoid } from 'nanoid';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const movement = await db.select().from(movements).where(eq(movements.id, params.id)).get();

	if (!movement) {
		throw redirect(303, '/movements');
	}

	return {
		movement,
		user: locals.user
	};
};

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		if (!locals.user) {
			return fail(401, { unauthorized: true });
		}

		const movement = await db.select().from(movements).where(eq(movements.id, params.id)).get();

		if (!movement) {
			return fail(404, { not_found: true });
		}

		try {
			const formData = await request.formData();

			const name = formData.get('name');
			const description = formData.get('description') || null;
			const type = formData.get('type');
			const defaultValue = formData.get('default_value');
			const defaultUnit = formData.get('default_unit') || null;
			const isBilateral = formData.get('is_bilateral') === 'on';
			const switchSidesDuration = formData.get('switch_sides_duration');
			const illustration = formData.get('illustration') as File | null;
			const removeIllustration = formData.get('remove_illustration') === 'true';
			const equipmentRaw = formData.get('equipment') || '';

			let equipment: string[] = [];
			if (typeof equipmentRaw === 'string' && equipmentRaw.trim()) {
				equipment = equipmentRaw.split(',').map(e => e.trim()).filter(Boolean);
			}

			if (!name || !type || !defaultValue) {
				return fail(400, { missing: true });
			}

			if (typeof name !== 'string' || typeof type !== 'string' || typeof defaultValue !== 'string') {
				return fail(400, { invalid: true });
			}

			const validTypes = ['timed', 'reps', 'weighted', 'resistance'];
			if (!validTypes.includes(type)) {
				return fail(400, { invalid_type: true });
			}

			const value = parseInt(defaultValue, 10);
			if (isNaN(value) || value <= 0) {
				return fail(400, { invalid_value: true });
			}

			const switchSidesDur = switchSidesDuration ? parseInt(String(switchSidesDuration), 10) : 5;
			if (isNaN(switchSidesDur) || switchSidesDur < 0) {
				return fail(400, { invalid_switch_sides_duration: true });
			}

			let illustrationPath = movement.illustrationPath;

			if (removeIllustration && illustrationPath) {
				const filepath = join(process.cwd(), 'static', illustrationPath);
				try {
					await unlink(filepath);
				} catch (e) {
					console.error('Failed to delete illustration:', e);
				}
				illustrationPath = null;
			}

			if (illustration && illustration.size > 0) {
				const validTypesImg = ['image/svg+xml', 'image/jpeg', 'image/png', 'image/webp'];
				if (!validTypesImg.includes(illustration.type)) {
					return fail(400, { invalid_file: true });
				}

				if (illustrationPath) {
					const oldFilepath = join(process.cwd(), 'static', illustrationPath);
					try {
						await unlink(oldFilepath);
					} catch (e) {
						console.error('Failed to delete old illustration:', e);
					}
				}

				const ext = illustration.name.split('.').pop()?.toLowerCase() || 'png';
				const filename = `${nanoid()}.${ext}`;
				const uploadDir = join(process.cwd(), 'static', 'uploads', 'movements');

				await mkdir(uploadDir, { recursive: true });
				const filepath = join(uploadDir, filename);
				const bytes = await illustration.arrayBuffer();
				await writeFile(filepath, Buffer.from(bytes));

				illustrationPath = `/uploads/movements/${filename}`;
			}

			const targetTypeMap = {
				timed: 'time' as const,
				reps: 'reps' as const,
				weighted: 'reps' as const,
				resistance: 'reps' as const
			};

			await db
				.update(movements)
				.set({
					name: String(name),
					description: description ? String(description) : null,
					type: type as 'timed' | 'reps' | 'weighted' | 'resistance',
					illustrationPath,
					weightUnit: (type === 'weighted' || type === 'resistance') && defaultUnit ? (defaultUnit as 'lbs' | 'kg' | 'bodyweight') : null,
					isBilateral,
					switchSidesDuration: switchSidesDur,
					equipment,
					metadata: {
						defaultTarget: {
							type: targetTypeMap[type as keyof typeof targetTypeMap],
							value,
							unit: undefined
						}
					}
				})
				.where(eq(movements.id, params.id));

			throw redirect(303, '/movements');
		} catch (error) {
			if (error && typeof error === 'object' && 'status' in error) {
				throw error;
			}
			console.error('Error updating movement:', error);
			return fail(500, { error: 'Failed to update movement' });
		}
	}
};
