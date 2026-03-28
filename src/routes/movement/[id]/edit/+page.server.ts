import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { movements } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateMovement } from '$lib/db/helpers/movements';
import { movementUpdateSchema } from '$lib/validation/schemas/movement';
import { checkboxParser } from '$lib/validation/helpers/parsers';
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

		const formData = await request.formData();

		// Collect submitted data for error returns
		const submittedData = {
			name: formData.get('name'),
			description: formData.get('description'),
			type: formData.get('type'),
			defaultValue: formData.get('default_value'),
			defaultUnit: formData.get('default_unit'),
			timePerRep: formData.get('time_per_rep'),
			isBilateral: checkboxParser(formData.get('is_bilateral')),
			switchSidesDuration: formData.get('switch_sides_duration'),
			equipment: formData.get('equipment')
		};

		const parsed = movementUpdateSchema.safeParse({
			...submittedData,
			illustration: formData.get('illustration')
		});

		if (!parsed.success) {
			// Map Zod errors to old error format for UI compatibility
			const errorIssues = parsed.error.issues;

			// Check for missing required fields
			const missingFields = errorIssues.filter(issue =>
				issue.message.includes('required') || issue.code === 'too_small'
			);
			if (missingFields.length > 0) {
				return fail(400, { missing: true, submittedData });
			}

			// Check for invalid type
			const typeError = errorIssues.find(issue => issue.path.includes('type'));
			if (typeError) {
				return fail(400, { invalid_type: true, submittedData });
			}

			// Check for invalid value
			const valueError = errorIssues.find(issue => issue.path.includes('defaultValue'));
			if (valueError) {
				return fail(400, { invalid_value: true, submittedData });
			}

			// Check for invalid file
			const fileError = errorIssues.find(issue => issue.path.includes('illustration'));
			if (fileError) {
				return fail(400, { invalid_file: true, submittedData });
			}

			return fail(400, { error: 'Validation failed', submittedData });
		}

		try {
			const removeIllustration = formData.get('remove_illustration') === 'true';
			const illustrationFile = parsed.data.illustration;

			await updateMovement(
				params.id,
				parsed.data,
				locals.user.id,
				illustrationFile || undefined,
				removeIllustration
			);

			throw redirect(303, '/movements');
		} catch (error) {
			if (error && typeof error === 'object' && 'status' in error) {
				throw error;
			}

			if (error instanceof Error) {
				if (error.message.includes('already exists')) {
					const match = error.message.match(/"([^"]+)"/);
					const existingName = match ? match[1] : '';
					return fail(409, { duplicate_name: true, existing_name: existingName, submittedData });
				}
				if (error.message.includes('not found')) {
					return fail(404, { not_found: true, error: error.message });
				}
				return fail(400, { error: error.message, submittedData });
			}

			console.error('Error updating movement:', error);
			return fail(500, { error: 'Failed to update movement' });
		}
	}
};
