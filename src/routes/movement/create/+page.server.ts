import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { movements } from '$lib/db/schema';
import { nanoid } from 'nanoid';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { RequestEvent } from './$types';

 	export const actions = {
 		default: async ({ request, locals }: RequestEvent) => {
 		if (!locals.user) {
 			return fail(401, { unauthorized: true });
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

 			let illustrationPath = null;
 			if (illustration && illustration.size > 0) {
 				const validTypes = ['image/svg+xml', 'image/jpeg', 'image/png', 'image/webp'];
 				if (!validTypes.includes(illustration.type)) {
 					return fail(400, { invalid_file: true });
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

   			await db.insert(movements).values({
   				id: nanoid(),
   				name: String(name),
   				description: description ? String(description) : null,
   				type: type as 'timed' | 'reps' | 'weighted' | 'resistance',
   				illustrationPath,
   				isCustom: true,
   				userId: locals.user.id,
   				weightUnit: (type === 'weighted' || type === 'resistance') && defaultUnit ? (defaultUnit as 'lbs' | 'kg' | 'bodyweight') : null,
   				isBilateral,
   				switchSidesDuration: switchSidesDur,
   				metadata: {
   					defaultTarget: {
   						type: targetTypeMap[type as keyof typeof targetTypeMap],
   						value,
   						unit: undefined
   					}
   				},
   				createdAt: new Date()
   			});

 			throw redirect(303, '/routine/create');
 		} catch (error) {
 			if (error && typeof error === 'object' && 'status' in error) {
 				throw error;
 			}
 			console.error('Error creating movement:', error);
 			return fail(500, { error: 'Failed to create movement' });
 		}
 	}
 };
