import { redirect, fail } from '@sveltejs/kit';
import { createMovement } from '$lib/db/helpers/movements';
import { movementSchema } from '$lib/validation/schemas/movement';
import { checkboxParser } from '$lib/validation/helpers/parsers';
import type { RequestEvent } from './$types';

export const actions = {
	default: async ({ request, locals }: RequestEvent) => {
		if (!locals.user) {
			return fail(401, { unauthorized: true });
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

		const parsed = movementSchema.safeParse({
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

			// Check for invalid value (must be positive)
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
			const illustrationFile = parsed.data.illustration;

			const movementId = await createMovement(
				parsed.data,
				locals.user.id,
				illustrationFile || undefined
			);

			throw redirect(303, `/movement/${movementId}`);
		} catch (error) {
			if (error && typeof error === 'object' && 'status' in error) {
				throw error;
			}

			if (error instanceof Error) {
				if (error.message.includes('already exists')) {
					// Extract existing name from error message
					const match = error.message.match(/"([^"]+)"/);
					const existingName = match ? match[1] : '';
					return fail(409, { duplicate_name: true, existing_name: existingName, submittedData });
				}
				return fail(400, { error: error.message, submittedData });
			}

			console.error('Error creating movement:', error);
			return fail(500, { error: 'Failed to create movement' });
		}
	}
};
