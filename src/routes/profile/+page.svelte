<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import PageHeader from '../../components/ui/PageHeader.svelte';
	import { 
		User, 
		Gear, 
		Key, 
		Lock, 
		Trash, 
		SignOut,
		Copy,
		Check,
		ArrowClockwise,
		Plus,
		Barbell,
		ListChecks,
		PersonSimple,
		Clock
	} from 'phosphor-svelte';
	
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
		if (form?.apiKey) {
			navigator.clipboard.writeText(form.apiKey);
			copiedApiKey = true;
			setTimeout(() => copiedApiKey = false, 2000);
		}
	}
</script>

<svelte:head>
	<title>Profile — Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-base">
	<PageHeader user={data.user} showNav={true} />

	<main class="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
		<!-- Hero Section -->
		<section class="mb-10 pb-6 border-b-2 border-accent-track">
			<div class="flex items-start gap-6">
				<!-- Avatar -->
				<div 
					class="w-24 h-24 sm:w-28 sm:h-28 bg-surface flex items-center justify-center text-5xl border-t-4 border-t-accent-primary shrink-0"
					style="box-shadow: var(--shadow-elevated);"
				>
					{avatar}
				</div>
				
				<div class="flex-1 min-w-0 pt-1">
					<div class="flex items-baseline gap-3 mb-1">
						<span class="text-text-muted text-sm uppercase tracking-widest font-body">Member since {formatDate(data.user.createdAt)}</span>
						<div class="flex-1 h-px bg-accent-track hidden sm:block"></div>
					</div>
					<h1 class="font-display text-4xl sm:text-5xl text-text-primary tracking-wide mb-2">
						{data.user.name || 'Your Profile'}
					</h1>
					<p class="text-text-secondary font-body">@{data.user.username || data.user.email.split('@')[0]}</p>
				</div>
			</div>

			<!-- Stats Bar -->
			<div class="flex flex-wrap items-center gap-6 sm:gap-8 mt-8 pt-6 border-t border-accent-track">
				<div class="flex items-baseline gap-2">
					<Barbell weight="duotone" size={18} class="text-accent-primary" />
					<span class="font-display text-3xl text-accent-primary">{data.stats.routinesCreated}</span>
					<span class="text-text-muted text-sm uppercase tracking-wider font-body">routines</span>
				</div>
				<div class="w-px h-8 bg-accent-track hidden sm:block"></div>
				<div class="flex items-baseline gap-2">
					<ListChecks weight="duotone" size={18} class="text-accent-secondary" />
					<span class="font-display text-3xl text-accent-secondary">{data.stats.practicesCompleted}</span>
					<span class="text-text-muted text-sm uppercase tracking-wider font-body">sessions</span>
				</div>
				<div class="w-px h-8 bg-accent-track hidden sm:block"></div>
				<div class="flex items-baseline gap-2">
					<PersonSimple weight="duotone" size={18} class="text-accent-warm" />
					<span class="font-display text-3xl text-accent-warm">{data.stats.movementsCreated}</span>
					<span class="text-text-muted text-sm uppercase tracking-wider font-body">movements</span>
				</div>
				<div class="w-px h-8 bg-accent-track hidden sm:block"></div>
				<div class="flex items-baseline gap-2">
					<Clock weight="duotone" size={18} class="text-text-muted" />
					<span class="font-display text-3xl text-text-primary">{formatDuration(data.stats.totalPracticeTime)}</span>
					<span class="text-text-muted text-sm uppercase tracking-wider font-body">total time</span>
				</div>
			</div>
		</section>

		<!-- Profile Information -->
		<section class="mb-10">
			<div class="flex items-center justify-between mb-6 pb-4 border-b border-accent-track">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-accent-primary/10 flex items-center justify-center">
						<User weight="duotone" size={20} class="text-accent-primary" />
					</div>
					<h2 class="font-display text-2xl text-text-primary tracking-wider">
						PROFILE INFORMATION
					</h2>
				</div>
			</div>
			
			<div 
				class="bg-surface p-6 sm:p-8 border-t-4 border-t-accent-primary"
				style="box-shadow: var(--shadow-elevated);"
			>
				<form method="POST" action="?/updateProfile" class="space-y-6">
					{#if form?.message && form?.success}
						<div class="bg-success/10 border border-success/20 px-4 py-3">
							<p class="text-success text-sm font-body">{form.message}</p>
						</div>
					{/if}
					
					{#if form?.error && !isPasswordError(form?.error)}
						<div class="bg-error/10 border border-error/20 px-4 py-3">
							<p class="text-error text-sm font-body">{form.error}</p>
						</div>
					{/if}
					
					<div class="grid sm:grid-cols-2 gap-5">
						<div>
							<label for="name" class="block text-sm font-body text-text-secondary mb-2 uppercase tracking-wider">
								Display Name
							</label>
							<input
								type="text"
								id="name"
								name="name"
								bind:value={name}
								class="w-full bg-inset text-text-primary border-2 border-accent-track px-4 py-3 focus:border-accent-primary focus:outline-none transition-colors font-body"
								placeholder="Your name"
							/>
						</div>
						
						<div>
							<label for="username" class="block text-sm font-body text-text-secondary mb-2 uppercase tracking-wider">
								Username
							</label>
							<input
								type="text"
								id="username"
								name="username"
								bind:value={username}
								class="w-full bg-inset text-text-primary border-2 border-accent-track px-4 py-3 focus:border-accent-primary focus:outline-none transition-colors font-body"
								placeholder="username"
							/>
						</div>
					</div>
					
					<div>
						<span class="block text-sm font-body text-text-secondary mb-3 uppercase tracking-wider">
							Avatar
						</span>
						<div class="flex gap-2 flex-wrap">
							{#each avatarOptions as emoji}
								<button
									type="button"
									onclick={() => avatar = emoji}
									aria-label="Select {emoji} as avatar"
									aria-pressed={avatar === emoji}
									class="text-2xl p-3 border-2 transition-all {avatar === emoji ? 'border-accent-primary bg-accent-primary/20' : 'border-accent-track hover:border-accent-primary hover:bg-surface-elevated'}"
								>
									{emoji}
								</button>
							{/each}
						</div>
						<input type="hidden" name="avatar" bind:value={avatar} />
					</div>
					
					<button
						type="submit"
						class="inline-flex items-center gap-2 px-6 py-3 bg-accent-primary text-white hover:bg-accent-primary-light transition-all duration-150 font-display text-base tracking-widest uppercase"
					>
						Save Profile
					</button>
				</form>
			</div>
		</section>

		<!-- Preferences -->
		<section class="mb-10">
			<div class="flex items-center justify-between mb-6 pb-4 border-b border-accent-track">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-accent-secondary/10 flex items-center justify-center">
						<Gear weight="duotone" size={20} class="text-accent-secondary" />
					</div>
					<h2 class="font-display text-2xl text-text-primary tracking-wider">
						PREFERENCES
					</h2>
				</div>
			</div>
			
			<div 
				class="bg-surface p-6 sm:p-8 border-t-4 border-t-accent-secondary"
				style="box-shadow: var(--shadow-elevated);"
			>
				<form method="POST" action="?/updatePreferences" class="space-y-5">
					<div class="space-y-4">
						<label class="flex items-center gap-4 cursor-pointer group">
							<input
								type="checkbox"
								name="autoAdvance"
								bind:checked={preferences.autoAdvance}
								class="w-5 h-5 border-2 border-accent-track bg-inset text-accent-primary focus:border-accent-primary focus:outline-none"
							/>
							<span class="text-text-secondary group-hover:text-text-primary transition-colors font-body">Auto-advance to next exercise</span>
						</label>
						
						<label class="flex items-center gap-4 cursor-pointer group">
							<input
								type="checkbox"
								name="audioEnabled"
								bind:checked={preferences.audioEnabled}
								class="w-5 h-5 border-2 border-accent-track bg-inset text-accent-primary focus:border-accent-primary focus:outline-none"
							/>
							<span class="text-text-secondary group-hover:text-text-primary transition-colors font-body">Enable audio cues</span>
						</label>
						
						<label class="flex items-center gap-4 cursor-pointer group">
							<input
								type="checkbox"
								name="keepAwake"
								bind:checked={preferences.keepAwake}
								class="w-5 h-5 border-2 border-accent-track bg-inset text-accent-primary focus:border-accent-primary focus:outline-none"
							/>
							<span class="text-text-secondary group-hover:text-text-primary transition-colors font-body">Keep screen awake during practice</span>
						</label>
					</div>
					
					<button
						type="submit"
						class="inline-flex items-center gap-2 px-6 py-3 bg-accent-secondary text-white hover:bg-accent-primary-light transition-all duration-150 font-display text-base tracking-widest uppercase"
					>
						Save Preferences
					</button>
				</form>
			</div>
		</section>

		<!-- API Key Management -->
		<section class="mb-10">
			<div class="flex items-center justify-between mb-6 pb-4 border-b border-accent-track">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-accent-warm/10 flex items-center justify-center">
						<Key weight="duotone" size={20} class="text-accent-warm" />
					</div>
					<h2 class="font-display text-2xl text-text-primary tracking-wider">
						API KEY
					</h2>
				</div>
			</div>
			
			<div 
				class="bg-surface p-6 sm:p-8 border-t-4 border-t-accent-warm"
				style="box-shadow: var(--shadow-elevated);"
			>
				{#if form?.message && form?.apiKey}
					<div class="bg-success/10 border border-success/20 p-4 mb-6">
						<p class="text-success font-title text-sm mb-3">{form.message}</p>
						<div class="bg-inset p-3 font-mono text-sm text-accent-primary-light break-all mb-3">
							{form.apiKey}
						</div>
						<button
							onclick={copyApiKey}
							class="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary/20 hover:bg-accent-primary/30 text-accent-primary border-2 border-accent-primary/50 transition-all duration-150 font-body text-sm"
						>
							{#if copiedApiKey}
								<Check weight="bold" size={16} />
								Copied!
							{:else}
								<Copy weight="duotone" size={16} />
								Copy to clipboard
							{/if}
						</button>
					</div>
				{/if}
				
				{#if data.user.apiKeyHash}
					<div class="space-y-4">
						<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-accent-track">
							<span class="text-text-secondary text-sm font-body uppercase tracking-wider">Current Key</span>
							<span class="font-mono text-sm text-text-primary bg-inset px-3 py-1">
								{data.user.apiKeyPrefix || 'strtchy_****...****'}
							</span>
						</div>
						
						<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-accent-track">
							<span class="text-text-secondary text-sm font-body uppercase tracking-wider">Created</span>
							<span class="text-text-primary text-sm font-body">{formatDate(data.user.apiKeyCreatedAt)}</span>
						</div>
						
						<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-accent-track">
							<span class="text-text-secondary text-sm font-body uppercase tracking-wider">Last Used</span>
							<span class="text-text-primary text-sm font-body">{data.user.apiKeyLastUsedAt ? formatDate(data.user.apiKeyLastUsedAt) : 'Never'}</span>
						</div>
						
						{#if !showRotateConfirm}
							<button
								onclick={() => showRotateConfirm = true}
								class="inline-flex items-center gap-2 px-4 py-2 bg-accent-warm/20 hover:bg-accent-warm/30 text-accent-warm border-2 border-accent-warm/50 transition-all duration-150 font-body text-sm"
							>
								<ArrowClockwise weight="duotone" size={16} />
								Rotate API Key
							</button>
						{:else}
							<div class="bg-error/10 border border-error/20 p-4">
								<p class="text-error text-sm font-body mb-4">
									Are you sure? This will invalidate your current API key immediately. Any applications using it will stop working.
								</p>
								<div class="flex flex-wrap gap-3">
									<form method="POST" action="?/rotateApiKey" class="flex-1 min-w-[140px]">
										<button
											type="submit"
											class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-error text-white hover:bg-error/80 transition-all duration-150 font-display text-sm tracking-wider uppercase"
										>
											Yes, Rotate Key
										</button>
									</form>
									<button
										onclick={() => showRotateConfirm = false}
										class="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2 bg-surface-elevated hover:bg-accent-track text-text-secondary transition-all duration-150 font-body text-sm"
									>
										Cancel
									</button>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<div class="text-center py-6">
						<p class="text-text-secondary text-sm font-body mb-4">
							You don't have an API key yet. Generate one to access the API programmatically.
						</p>
						<form method="POST" action="?/rotateApiKey">
							<button
								type="submit"
								class="inline-flex items-center gap-2 px-6 py-3 bg-accent-warm text-white hover:bg-accent-orange transition-all duration-150 font-display text-base tracking-widest uppercase"
							>
								<Plus weight="bold" size={18} />
								Generate API Key
							</button>
						</form>
					</div>
				{/if}
			</div>
		</section>

		<!-- Password Change -->
		<section class="mb-10">
			<div class="flex items-center justify-between mb-6 pb-4 border-b border-accent-track">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-accent-track flex items-center justify-center">
						<Lock weight="duotone" size={20} class="text-text-muted" />
					</div>
					<h2 class="font-display text-2xl text-text-primary tracking-wider">
						CHANGE PASSWORD
					</h2>
				</div>
			</div>
			
			<div 
				class="bg-surface p-6 sm:p-8 border-t-4 border-t-accent-track"
				style="box-shadow: var(--shadow-elevated);"
			>
				{#if !showPasswordForm}
					<button
						onclick={() => showPasswordForm = true}
						class="inline-flex items-center gap-2 px-6 py-3 bg-surface-elevated hover:bg-accent-track text-text-secondary hover:text-text-primary transition-all duration-150 font-body text-sm"
					>
						<Lock weight="duotone" size={18} />
						Change Password
					</button>
				{:else}
					<form method="POST" action="?/changePassword" class="space-y-5">
						{#if form && isPasswordError(form.error)}
							<div class="bg-error/10 border border-error/20 px-4 py-3">
								<p class="text-error text-sm font-body">{form.error}</p>
							</div>
						{/if}
						
						{#if form?.message && form?.success}
							<div class="bg-success/10 border border-success/20 px-4 py-3">
								<p class="text-success text-sm font-body">{form.message}</p>
							</div>
						{/if}
						
						<div>
							<label for="currentPassword" class="block text-sm font-body text-text-secondary mb-2 uppercase tracking-wider">
								Current Password
							</label>
							<input
								type="password"
								id="currentPassword"
								name="currentPassword"
								bind:value={currentPassword}
								class="w-full bg-inset text-text-primary border-2 border-accent-track px-4 py-3 focus:border-accent-primary focus:outline-none transition-colors font-body"
							/>
						</div>
						
						<div>
							<label for="newPassword" class="block text-sm font-body text-text-secondary mb-2 uppercase tracking-wider">
								New Password
							</label>
							<input
								type="password"
								id="newPassword"
								name="newPassword"
								bind:value={newPassword}
								class="w-full bg-inset text-text-primary border-2 border-accent-track px-4 py-3 focus:border-accent-primary focus:outline-none transition-colors font-body"
							/>
						</div>
						
						<div>
							<label for="confirmPassword" class="block text-sm font-body text-text-secondary mb-2 uppercase tracking-wider">
								Confirm New Password
							</label>
							<input
								type="password"
								id="confirmPassword"
								name="confirmPassword"
								bind:value={confirmPassword}
								class="w-full bg-inset text-text-primary border-2 border-accent-track px-4 py-3 focus:border-accent-primary focus:outline-none transition-colors font-body"
							/>
						</div>
						
						<div class="flex flex-wrap gap-3 pt-2">
							<button
								type="submit"
								class="inline-flex items-center gap-2 px-6 py-3 bg-accent-primary text-white hover:bg-accent-primary-light transition-all duration-150 font-display text-base tracking-widest uppercase"
							>
								Update Password
							</button>
							<button
								type="button"
								onclick={() => showPasswordForm = false}
								class="inline-flex items-center gap-2 px-6 py-3 bg-surface-elevated hover:bg-accent-track text-text-secondary hover:text-text-primary transition-all duration-150 font-body text-sm"
							>
								Cancel
							</button>
						</div>
					</form>
				{/if}
			</div>
		</section>

		<!-- Danger Zone -->
		<section class="mb-10">
			<div class="flex items-center justify-between mb-6 pb-4 border-b border-error/50">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-error/10 flex items-center justify-center">
						<Trash weight="duotone" size={20} class="text-error" />
					</div>
					<h2 class="font-display text-2xl text-error tracking-wider">
						DANGER ZONE
					</h2>
				</div>
			</div>
			
			<div class="space-y-6">
				<!-- Sign Out -->
				<div 
					class="bg-surface p-6 sm:p-8 border-t-4 border-t-accent-track"
					style="box-shadow: var(--shadow-elevated);"
				>
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div class="flex items-center gap-3">
							<SignOut weight="duotone" size={20} class="text-text-muted" />
							<div>
								<h3 class="font-title text-text-primary mb-1">Sign Out</h3>
								<p class="text-text-secondary text-sm font-body">End your current session</p>
							</div>
						</div>
						<form method="POST" action="/?/logout">
							<button
								type="submit"
								class="inline-flex items-center gap-2 px-6 py-3 bg-surface-elevated hover:bg-accent-track text-text-secondary hover:text-text-primary transition-all duration-150 font-body text-sm"
							>
								<SignOut weight="duotone" size={16} />
								Sign Out
							</button>
						</form>
					</div>
				</div>

				<!-- Delete Account -->
				<div 
					class="bg-surface p-6 sm:p-8 border-t-4 border-t-error"
					style="box-shadow: var(--shadow-elevated);"
				>
					{#if !showDeleteConfirm}
						<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div class="flex items-center gap-3">
								<Trash weight="duotone" size={20} class="text-error" />
								<div>
									<h3 class="font-title text-error mb-1">Delete Account</h3>
									<p class="text-text-secondary text-sm font-body">Permanently remove all your data</p>
								</div>
							</div>
							<button
								onclick={() => showDeleteConfirm = true}
								class="inline-flex items-center gap-2 px-6 py-3 bg-error/20 hover:bg-error/30 text-error border-2 border-error/50 transition-all duration-150 font-body text-sm"
							>
								<Trash weight="duotone" size={16} />
								Delete Account
							</button>
						</div>
					{:else}
						<div class="space-y-5">
							{#if form && isDeleteError(form.error)}
								<div class="bg-error/10 border border-error/20 px-4 py-3">
									<p class="text-error text-sm font-body">{form.error}</p>
								</div>
							{/if}
							
							<p class="text-error text-sm font-body">
								This will permanently delete your account and all associated data including your custom movements, routines, and practice history. This action cannot be undone.
							</p>
							
							<form method="POST" action="?/deleteAccount" class="space-y-4">
								<div>
									<label for="confirmDelete" class="block text-sm font-body text-error mb-2 uppercase tracking-wider">
										Type "DELETE" to confirm
									</label>
									<input
										type="text"
										id="confirmDelete"
										name="confirmDelete"
										bind:value={deleteConfirmText}
										class="w-full bg-inset text-text-primary border-2 border-error/50 px-4 py-3 focus:border-error focus:outline-none transition-colors font-body"
										placeholder="DELETE"
									/>
								</div>
								
								<div>
									<label for="password" class="block text-sm font-body text-error mb-2 uppercase tracking-wider">
										Enter your password to confirm
									</label>
									<input
										type="password"
										id="password"
										name="password"
										class="w-full bg-inset text-text-primary border-2 border-error/50 px-4 py-3 focus:border-error focus:outline-none transition-colors font-body"
										placeholder="Your password"
									/>
								</div>
								
								<div class="flex flex-wrap gap-3 pt-2">
									<button
										type="submit"
										class="inline-flex items-center gap-2 px-6 py-3 bg-error text-white hover:bg-error/80 transition-all duration-150 font-display text-base tracking-widest uppercase"
									>
										<Trash weight="duotone" size={16} />
										Permanently Delete
									</button>
									<button
										type="button"
										onclick={() => { showDeleteConfirm = false; deleteConfirmText = ''; }}
										class="inline-flex items-center gap-2 px-6 py-3 bg-surface-elevated hover:bg-accent-track text-text-secondary hover:text-text-primary transition-all duration-150 font-body text-sm"
									>
										Cancel
									</button>
								</div>
							</form>
						</div>
					{/if}
				</div>
			</div>
		</section>
	</main>
</div>

<script lang="ts" module>
	function isPasswordError(error: string | undefined): boolean {
		if (!error) return false;
		const passwordErrors = [
			'All password fields are required',
			'Invalid password data',
			'New passwords do not match',
			'Password must be at least 6 characters',
			'Current password is incorrect',
			'Cannot change password for this account',
			'Failed to change password'
		];
		return passwordErrors.includes(error);
	}
	
	function isDeleteError(error: string | undefined): boolean {
		if (!error) return false;
		const deleteErrors = [
			'Please type DELETE to confirm account deletion',
			'Password is required to delete account',
			'Failed to delete account. Please check your password.'
		];
		return deleteErrors.includes(error);
	}
</script>
