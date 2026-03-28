import type { ZodError } from 'zod';

export function formatZodError(error: ZodError) {
	const fieldErrors: Record<string, string> = {};
	const errors: string[] = [];

	for (const issue of error.issues) {
		const path = issue.path.join('.');
		if (path) {
			fieldErrors[path] = issue.message;
		} else {
			errors.push(issue.message);
		}
	}

	return {
		success: false,
		errors,
		fieldErrors
	};
}

export function formatApiError(error: Error | unknown) {
	if (error instanceof Error) {
		return {
			success: false,
			error: error.message
		};
	}
	return {
		success: false,
		error: 'An unexpected error occurred'
	};
}
