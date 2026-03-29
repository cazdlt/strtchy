<script lang="ts">
	import type { PageData, ActionData } from './$types';
	
	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	// Profile form state
	let name = $state(data.user.name || '');
	let username = $state(data.user.username || '');
	let avatar = $state(data.user.image || '🧘');
	
	// Password form state
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let showPasswordForm = $state(false);
	
	// Preferences state
	let preferences = $state({
		autoAdvance: data.user.preferences?.autoAdvance ?? true,
		audioEnabled: data.user.preferences?.audioEnabled ?? true,
		keepAwake: data.user.preferences?.keepAwake ?? true
	});
	
	// Delete account state
	let showDeleteConfirm = $state(false);
	let deleteConfirmText = $state('');
	
	// API key state
	let showNewApiKey = $state(false);
	let newApiKey = $state('');
	let copiedApiKey = $state(false);
	let showRotateConfirm = $state(false);
	
	// Common emoji options for avatars
	const avatarOptions = [
		'🧘', '🏃', '🤸', '🏋️', '💪', '👤', '🧑', '🎭', 
		'🌟', '🔥', '💎', '⚡', '🌈', '🎯', '🎪', '🦁'
	];
	
	// Format duration from seconds
	function formatDuration(seconds: number): string {
		if (seconds < 60) return `${seconds}s`;
		if (seconds < 3600) {
			const mins = Math.floor(seconds / 60);
			const secs = seconds % 60;
			return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
		}
		const hours = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}
	
	// Format date
	function formatDate(date: Date | string | null | undefined): string {
		if (!date) return 'N/A';
		const d = new Date(date);
		return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
	}
	
	// Copy API key to clipboard
	function copyApiKey() {
		navigator.clipboard.writeText(newApiKey);
		copiedApiKey = true;
		setTimeout(() => copiedApiKey = false, 2000);
	}
</script>

<svelte:head>
	<title>Profile - Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
	<header class="p-6 border-b border-gray-800">
		<div class="max-w-4xl mx-auto flex items-center justify-between">
			<div class="flex items-center gap-4">
			<a href="/" class="text-emerald-500 hover:text-emerald-400 transition-colors" aria-label="Go back">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="m12 19-7-7 7-7"/>
					<path d="M19 12H5"/>
				</svg>
			</a>
				<h1 class="text-xl font-semibold">Your Profile</h1>
			</div>
		</div>
	</header>

	<main class="max-w-4xl mx-auto p-6 space-y-8">
		<!-- Profile Header with Avatar -->
		<div class="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
			<div class="flex items-start gap-6">
				<div class="text-6xl bg-gray-900/50 rounded-2xl p-4 border border-gray-700">
					{avatar}
				</div>
				<div class="flex-1">
					<h2 class="text-2xl font-bold mb-1">{data.user.name || 'Anonymous'}</h2>
					<p class="text-gray-400 mb-2">@{data.user.username || data.user.email.split('@')[0]}</p>
					<p class="text-gray-500 text-sm">Member since {formatDate(data.user.createdAt)}</p>
				</div>
			</div>
		</div>

		<!-- Statistics -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div class="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 text-center">
				<p class="text-3xl font-bold text-emerald-500">{data.stats.practicesCompleted}</p>
				<p class="text-gray-400 text-sm">Practices</p>
			</div>
			<div class="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 text-center">
				<p class="text-3xl font-bold text-blue-500">{data.stats.routinesCreated}</p>
				<p class="text-gray-400 text-sm">Routines</p>
			</div>
			<div class="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 text-center">
				<p class="text-3xl font-bold text-purple-500">{data.stats.movementsCreated}</p>
				<p class="text-gray-400 text-sm">Movements</p>
			</div>
			<div class="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 text-center">
				<p class="text-3xl font-bold text-orange-500">{formatDuration(data.stats.totalPracticeTime)}</p>
				<p class="text-gray-400 text-sm">Total Time</p>
			</div>
		</div>

		<!-- Profile Information Form -->
		<div class="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
			<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500">
					<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
					<circle cx="12" cy="7" r="4"/>
				</svg>
				Profile Information
			</h3>
			
			<form method="POST" action="?/updateProfile" class="space-y-4">
				{#if form?.message && form?.success}
					<div class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg">
						{form.message}
					</div>
				{/if}
				
				{#if form?.error && form?.error !== 'All password fields are required' && form?.error !== 'Invalid password data' && form?.error !== 'New passwords do not match' && form?.error !== 'Password must be at least 6 characters' && form?.error !== 'Current password is incorrect' && form?.error !== 'Cannot change password for this account' && form?.error !== 'Failed to change password' && form?.error !== 'Please type DELETE to confirm account deletion'}
					<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
						{form.error}
					</div>
				{/if}
				
				<div>
					<label for="name" class="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
					<input
						type="text"
						id="name"
						name="name"
						bind:value={name}
						class="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
						placeholder="Your name"
					/>
				</div>
				
				<div>
					<label for="username" class="block text-sm font-medium text-gray-300 mb-1">Username</label>
					<input
						type="text"
						id="username"
						name="username"
						bind:value={username}
						class="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
						placeholder="username"
					/>
				</div>
				
				<div>
					<span class="block text-sm font-medium text-gray-300 mb-2">Avatar</span>
					<div class="flex gap-2 flex-wrap">
						{#each avatarOptions as emoji}
							<button
								type="button"
								onclick={() => avatar = emoji}
								aria-label="Select {emoji} as avatar"
								aria-pressed={avatar === emoji}
								class="text-2xl p-2 rounded-lg border transition-all {avatar === emoji ? 'border-emerald-500 bg-emerald-500/20' : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800'}"
							>
								{emoji}
							</button>
						{/each}
					</div>
					<input type="hidden" name="avatar" bind:value={avatar} />
				</div>
				
				<button
					type="submit"
					class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
				>
					Save Profile
				</button>
			</form>
		</div>

		<!-- Preferences Form -->
		<div class="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
			<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500">
					<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
					<circle cx="12" cy="12" r="3"/>
				</svg>
				Preferences
			</h3>
			
			<form method="POST" action="?/updatePreferences" class="space-y-4">
				<div class="space-y-3">
					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							name="autoAdvance"
							bind:checked={preferences.autoAdvance}
							class="w-5 h-5 rounded border-gray-600 text-emerald-600 focus:ring-emerald-500"
						/>
						<span class="text-gray-300">Auto-advance to next exercise</span>
					</label>
					
					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							name="audioEnabled"
							bind:checked={preferences.audioEnabled}
							class="w-5 h-5 rounded border-gray-600 text-emerald-600 focus:ring-emerald-500"
						/>
						<span class="text-gray-300">Enable audio cues</span>
					</label>
					
					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							name="keepAwake"
							bind:checked={preferences.keepAwake}
							class="w-5 h-5 rounded border-gray-600 text-emerald-600 focus:ring-emerald-500"
						/>
						<span class="text-gray-300">Keep screen awake during practice</span>
					</label>
				</div>
				
				<button
					type="submit"
					class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
				>
					Save Preferences
				</button>
			</form>
		</div>

		<!-- API Key Management -->
		<div class="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
			<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-500">
					<path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
				</svg>
				API Key
			</h3>
			
			{#if form?.message && form?.apiKey}
				<div class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg mb-4">
					<p class="font-medium mb-2">{form.message}</p>
					<div class="bg-gray-900/80 rounded-lg p-3 font-mono text-sm text-emerald-300 break-all mb-2">
						{form.apiKey}
					</div>
					<button
						onclick={copyApiKey}
						class="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/50 rounded-lg py-2 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-2"
					>
						{#if copiedApiKey}
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M20 6 9 17l-5-5"/>
							</svg>
							Copied!
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
								<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
							</svg>
							Copy to clipboard
						{/if}
					</button>
				</div>
			{/if}
			
			{#if data.user.apiKeyHash}
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-400">Current Key</span>
						<span class="text-sm font-mono bg-gray-900/50 px-3 py-1 rounded text-gray-300">
							{data.user.apiKeyPrefix || 'strtchy_****...****'}
						</span>
					</div>
					
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-400">Created</span>
						<span class="text-sm text-gray-300">{formatDate(data.user.apiKeyCreatedAt)}</span>
					</div>
					
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-400">Last Used</span>
						<span class="text-sm text-gray-300">{data.user.apiKeyLastUsedAt ? formatDate(data.user.apiKeyLastUsedAt) : 'Never'}</span>
					</div>
					
					{#if !showRotateConfirm}
						<button
							onclick={() => showRotateConfirm = true}
							class="w-full mt-3 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-600/50 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
								<path d="M3 3v5h5"/>
								<path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
								<path d="M16 21h5v-5"/>
							</svg>
							Rotate API Key
						</button>
					{:else}
						<div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-3">
							<p class="text-red-400 text-sm mb-3">
								Are you sure? This will invalidate your current API key immediately. Any applications using it will stop working.
							</p>
							<div class="flex gap-3">
								<form method="POST" action="?/rotateApiKey" class="flex-1">
									<button
										type="submit"
										class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
									>
										Yes, Rotate Key
									</button>
								</form>
								<button
									onclick={() => showRotateConfirm = false}
									class="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
								>
									Cancel
								</button>
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<div class="text-center py-4">
					<p class="text-gray-400 text-sm mb-3">
						You don't have an API key yet. Generate one to access the API programmatically.
					</p>
					<form method="POST" action="?/rotateApiKey">
						<button
							type="submit"
							class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M12 4v16"/>
								<path d="M4 12h16"/>
							</svg>
							Generate API Key
						</button>
					</form>
				</div>
			{/if}
		</div>

		<!-- Password Change -->
		<div class="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
			<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-500">
					<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
					<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
				</svg>
				Change Password
			</h3>
			
			{#if !showPasswordForm}
				<button
					onclick={() => showPasswordForm = true}
					class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
				>
					Change Password
				</button>
			{:else}
				<form method="POST" action="?/changePassword" class="space-y-4">
					{#if form?.error && (form?.error === 'All password fields are required' || form?.error === 'Invalid password data' || form?.error === 'New passwords do not match' || form?.error === 'Password must be at least 6 characters' || form?.error === 'Current password is incorrect' || form?.error === 'Cannot change password for this account' || form?.error === 'Failed to change password')}
						<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
							{form.error}
						</div>
					{/if}
					
					{#if form?.message && form?.success}
						<div class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg">
							{form.message}
						</div>
					{/if}
					
					<div>
						<label for="currentPassword" class="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
						<input
							type="password"
							id="currentPassword"
							name="currentPassword"
							bind:value={currentPassword}
							class="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
						/>
					</div>
					
					<div>
						<label for="newPassword" class="block text-sm font-medium text-gray-300 mb-1">New Password</label>
						<input
							type="password"
							id="newPassword"
							name="newPassword"
							bind:value={newPassword}
							class="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
						/>
					</div>
					
					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							bind:value={confirmPassword}
							class="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
						/>
					</div>
					
					<div class="flex gap-3">
						<button
							type="submit"
							class="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium"
						>
							Update Password
						</button>
						<button
							type="button"
							onclick={() => showPasswordForm = false}
							class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
						>
							Cancel
						</button>
					</div>
				</form>
			{/if}
		</div>

		<!-- Delete Account -->
		<div class="bg-gray-800/50 border border-red-900/50 rounded-xl p-6">
			<h3 class="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 6h18"/>
					<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
					<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
				</svg>
				Delete Account
			</h3>
			
			<p class="text-gray-400 text-sm mb-4">
				This will permanently delete your account and all associated data including your custom movements, routines, and practice history. This action cannot be undone.
			</p>
			
			{#if !showDeleteConfirm}
				<button
					onclick={() => showDeleteConfirm = true}
					class="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 rounded-lg transition-colors text-sm"
				>
					Delete Account
				</button>
			{:else}
				<form method="POST" action="?/deleteAccount" class="space-y-4">
					{#if form?.error === 'Please type DELETE to confirm account deletion' || form?.error === 'Password is required to delete account' || form?.error === 'Failed to delete account. Please check your password.'}
						<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
							{form.error}
						</div>
					{/if}
					
					<div>
						<label for="confirmDelete" class="block text-sm font-medium text-red-400 mb-1">
							Type "DELETE" to confirm
						</label>
						<input
							type="text"
							id="confirmDelete"
							name="confirmDelete"
							bind:value={deleteConfirmText}
							class="w-full bg-gray-900/50 border border-red-600/50 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
							placeholder="DELETE"
						/>
					</div>
					
					<div>
						<label for="password" class="block text-sm font-medium text-red-400 mb-1">
							Enter your password to confirm
						</label>
						<input
							type="password"
							id="password"
							name="password"
							class="w-full bg-gray-900/50 border border-red-600/50 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
							placeholder="Your password"
						/>
					</div>
					
					<div class="flex gap-3">
						<button
							type="submit"
							class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
						>
							Permanently Delete Account
						</button>
						<button
							type="button"
							onclick={() => { showDeleteConfirm = false; deleteConfirmText = ''; }}
							class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
						>
							Cancel
						</button>
					</div>
				</form>
			{/if}
		</div>
		<!-- Sign Out -->
		<div class="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
			<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
					<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
					<polyline points="16 17 21 12 16 7"/>
					<line x1="21" x2="9" y1="12" y2="12"/>
				</svg>
				Sign Out
			</h3>
			
			<form method="POST" action="/?/logout">
				<button
					type="submit"
					class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
						<polyline points="16 17 21 12 16 7"/>
						<line x1="21" x2="9" y1="12" y2="12"/>
					</svg>
					Sign Out
				</button>
			</form>
		</div>
	</main>
</div>
