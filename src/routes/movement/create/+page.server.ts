import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { movements } from '$lib/db/schema';
import { nanoid } from 'nanoid';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { generateMovementId } from '$lib/utils/id';
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
			const timePerRep = formData.get('time_per_rep');
			const isBilateral = formData.get('is_bilateral') === 'on';
			const switchSidesDuration = formData.get('switch_sides_duration');
			const illustration = formData.get('illustration') as File | null;
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

			const existingMovement = await db.query.movements.findFirst({
				where: (movement, { eq }) => eq(movement.name, String(name))
			});

			if (existingMovement) {
				return fail(409, { duplicate_name: true, existing_name: existingMovement.name });
			}

    		const validTypes = ['timed', 'reps', 'weighted', 'resistance_band'];
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
    				const validTypesImg = ['image/svg+xml', 'image/jpeg', 'image/png', 'image/webp'];
    				if (!validTypesImg.includes(illustration.type)) {
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
    			resistance_band: 'reps' as const
    		};

      			await db.insert(movements).values({
      				id: generateMovementId(String(name)),
      				name: String(name),
    				description: description ? String(description) : null,
    				type: type as 'timed' | 'reps' | 'weighted' | 'resistance_band',
    				illustrationPath,
    				isCustom: true,
    				userId: locals.user.id,
    				weightUnit: (type === 'weighted' || type === 'resistance_band') && defaultUnit ? (defaultUnit as 'lbs' | 'kg' | 'bodyweight') : null,
    				isBilateral,
    				switchSidesDuration: switchSidesDur,
    				timePerRep: type !== 'timed' && timePerRep ? parseInt(String(timePerRep), 10) || 3 : null,
    				equipment,
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
