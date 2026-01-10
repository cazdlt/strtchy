import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { movements } from '$lib/db/schema';
import { nanoid } from 'nanoid';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { RequestEvent } from './$types';

 	export const actions = {
		default: async ({ request, locals }: RequestEvent) => {
		const formData = await request.formData();

		const name = formData.get('name');
		const description = formData.get('description') || null;
		const type = formData.get('type');
		const defaultValue = formData.get('default_value');
		const defaultUnit = formData.get('default_unit') || null;
		const illustration = formData.get('illustration') as File | null;

		if (!name || !type || !defaultValue) {
			return fail(400, { missing: true });
		}

		if (typeof name !== 'string' || typeof type !== 'string' || typeof defaultValue !== 'string') {
			return fail(400, { invalid: true });
		}

		const validTypes = ['timed', 'reps', 'count', 'distance'];
		if (!validTypes.includes(type)) {
			return fail(400, { invalid_type: true });
		}

		const value = parseInt(defaultValue, 10);
		if (isNaN(value) || value <= 0) {
			return fail(400, { invalid_value: true });
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
			distance: 'distance' as const,
			count: 'reps' as const
		};

		await db.insert(movements).values({
			id: nanoid(),
			name: String(name),
			description: description ? String(description) : null,
			type: type as 'timed' | 'reps' | 'count' | 'distance',
			illustrationPath,
			isCustom: true,
			userId: locals.user?.id,
			metadata: {
				defaultTarget: {
					type: targetTypeMap[type as keyof typeof targetTypeMap],
					value,
					unit: defaultUnit ? String(defaultUnit) : undefined
				}
			},
			createdAt: new Date()
		});

		throw redirect(303, '/');
	}
};
