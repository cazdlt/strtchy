import { db } from '$lib/db';
import { user, movements, routines, practiceLogs } from '$lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { auth } from '$lib/auth';

export async function load({ locals }: { locals: App.Locals }) {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Get user details with preferences
	const userData = await db.query.user.findFirst({
		where: eq(user.id, locals.user.id)
	});

	if (!userData) {
		throw redirect(302, '/login');
	}

	// Get user statistics
	const [movementCount] = await db
		.select({ count: count() })
		.from(movements)
		.where(eq(movements.userId, locals.user.id));

	const [routineCount] = await db
		.select({ count: count() })
		.from(routines)
		.where(eq(routines.userId, locals.user.id));

	const [practiceCount] = await db
		.select({ count: count() })
		.from(practiceLogs)
		.where(eq(practiceLogs.userId, locals.user.id));

	// Get total practice duration
	const [totalDurationResult] = await db
		.select({ totalDuration: practiceLogs.duration })
		.from(practiceLogs)
		.where(eq(practiceLogs.userId, locals.user.id));

	const totalDuration = totalDurationResult?.totalDuration || 0;

	return {
		user: userData,
		stats: {
			movementsCreated: movementCount?.count || 0,
			routinesCreated: routineCount?.count || 0,
			practicesCompleted: practiceCount?.count || 0,
			totalPracticeTime: totalDuration
		}
	};
}

export const actions = {
	// Update profile information (name, username, avatar)
	updateProfile: async ({ request, locals }: RequestEvent) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const name = formData.get('name');
		const username = formData.get('username');
		const avatar = formData.get('avatar');

		if (!name || typeof name !== 'string') {
			return fail(400, { error: 'Name is required' });
		}

		const updateData: { name: string; username?: string; image?: string } = {
			name: name.trim()
		};

		if (username && typeof username === 'string') {
			updateData.username = username.trim();
		}

		if (avatar && typeof avatar === 'string') {
			updateData.image = avatar.trim();
		}

		try {
			await db
				.update(user)
				.set(updateData)
				.where(eq(user.id, locals.user.id));

			return { success: true, message: 'Profile updated successfully' };
		} catch (error) {
			console.error('Error updating profile:', error);
			return fail(500, { error: 'Failed to update profile' });
		}
	},

	// Update preferences
	updatePreferences: async ({ request, locals }: RequestEvent) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		
		// Get current preferences
		const userData = await db.query.user.findFirst({
			where: eq(user.id, locals.user.id)
		});

		const currentPrefs = userData?.preferences || {};

		// Parse form values
		const autoAdvance = formData.get('autoAdvance');
		const audioEnabled = formData.get('audioEnabled');
		const keepAwake = formData.get('keepAwake');

		const newPrefs = {
			...currentPrefs,
			autoAdvance: autoAdvance === 'on',
			audioEnabled: audioEnabled === 'on',
			keepAwake: keepAwake === 'on'
		};

		try {
			await db
				.update(user)
				.set({ preferences: newPrefs })
				.where(eq(user.id, locals.user.id));

			return { success: true, message: 'Preferences updated successfully' };
		} catch (error) {
			console.error('Error updating preferences:', error);
			return fail(500, { error: 'Failed to update preferences' });
		}
	},

	// Change password using BetterAuth API
	changePassword: async ({ request, locals, cookies }: RequestEvent) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const currentPassword = formData.get('currentPassword');
		const newPassword = formData.get('newPassword');
		const confirmPassword = formData.get('confirmPassword');

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { error: 'All password fields are required' });
		}

		if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || typeof confirmPassword !== 'string') {
			return fail(400, { error: 'Invalid password data' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'New passwords do not match' });
		}

		if (newPassword.length < 6) {
			return fail(400, { error: 'Password must be at least 6 characters' });
		}

		try {
			// Use BetterAuth's changePassword API
			await auth.api.changePassword({
				body: {
					currentPassword,
					newPassword,
					revokeOtherSessions: false
				},
				headers: request.headers
			});

			return { success: true, message: 'Password changed successfully' };
		} catch (error: any) {
			console.error('Error changing password:', error);
			const message = error?.body?.message || error?.message || 'Current password is incorrect or password change failed';
			return fail(400, { error: message });
		}
	},

	// Delete account
	deleteAccount: async ({ request, locals, cookies }: RequestEvent) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const confirmText = formData.get('confirmDelete');
		const password = formData.get('password');

		if (!confirmText || confirmText !== 'DELETE') {
			return fail(400, { error: 'Please type DELETE to confirm account deletion' });
		}

		if (!password || typeof password !== 'string') {
			return fail(400, { error: 'Password is required to delete account' });
		}

		try {
			// First, delete user's data from our custom tables
			await db
				.delete(practiceLogs)
				.where(eq(practiceLogs.userId, locals.user.id));

			await db
				.delete(routines)
				.where(eq(routines.userId, locals.user.id));

			await db
				.delete(movements)
				.where(eq(movements.userId, locals.user.id));

			// Use BetterAuth's deleteUser API with password
			await auth.api.deleteUser({
				body: {
					password: password
				},
				headers: request.headers
			});

			// Clear session cookie
			cookies.delete('better-auth.session_token', { path: '/' });

			throw redirect(302, '/');
		} catch (error: any) {
			// Let redirects bubble up
			if (error && typeof error === 'object' && 'location' in error) {
				throw error;
			}
			console.error('Error deleting account:', error);
			const message = error?.body?.message || error?.message || 'Failed to delete account. Please check your password.';
			return fail(400, { error: message });
		}
	}
};
