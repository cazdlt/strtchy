<script lang="ts">
	import PageHeader from '../../components/ui/PageHeader.svelte';
	import { ArrowRight, LockKey } from 'phosphor-svelte';

	let { data, form } = $props();
	let newPassword = $state('');
	let confirmPassword = $state('');
</script>

<svelte:head>
	<title>Reset Password — Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-base relative overflow-hidden">
	<div class="relative">
		<PageHeader user={null} showNav={false} />

		<main class="flex-1 flex items-center justify-center px-6 py-12">
			<div class="w-full max-w-md">
				<div
					class="bg-surface p-8 sm:p-10 border-t-4 border-t-accent-primary"
					style="box-shadow: var(--shadow-elevated);"
				>
					<div class="mb-8">
						<div class="flex items-baseline gap-3 mb-2">
							<span class="text-text-muted text-sm uppercase tracking-widest font-body">Account recovery</span>
							<div class="flex-1 h-px bg-accent-track"></div>
						</div>
						<h1 class="font-display text-4xl text-text-primary tracking-wide">
							RESET PASSWORD
						</h1>
					</div>

					{#if data.error || !data.token}
						<div class="space-y-6">
							<div class="bg-error/10 border border-error/20 px-4 py-3">
								<p class="text-error text-sm font-body">
									This password reset link is invalid or has expired.
								</p>
							</div>
							<a
								href="/forgot-password"
								class="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent-primary text-white hover:bg-accent-primary-light transition-all duration-150 font-display text-lg tracking-widest uppercase"
							>
								Request a New Link
								<ArrowRight weight="bold" size={20} />
							</a>
						</div>
					{:else}
						<form method="POST" class="space-y-5">
							<input type="hidden" name="token" value={data.token} />

							{#if form?.missing}
								<div class="bg-error/10 border border-error/20 px-4 py-3">
									<p class="text-error text-sm font-body">Please fill in all fields</p>
								</div>
							{/if}

							{#if form?.error}
								<div class="bg-error/10 border border-error/20 px-4 py-3">
									<p class="text-error text-sm font-body">{form.error}</p>
								</div>
							{/if}

							<div>
								<label for="newPassword" class="block text-sm font-body text-text-secondary mb-2 uppercase tracking-wider">
									New Password
								</label>
								<input
									id="newPassword"
									name="newPassword"
									type="password"
									bind:value={newPassword}
									class="w-full bg-inset text-text-primary border-2 border-accent-track px-4 py-3 focus:border-accent-primary focus:outline-none transition-colors font-body"
									placeholder="••••••••"
									minlength="8"
									required
								/>
							</div>

							<div>
								<label for="confirmPassword" class="block text-sm font-body text-text-secondary mb-2 uppercase tracking-wider">
									Confirm Password
								</label>
								<input
									id="confirmPassword"
									name="confirmPassword"
									type="password"
									bind:value={confirmPassword}
									class="w-full bg-inset text-text-primary border-2 border-accent-track px-4 py-3 focus:border-accent-primary focus:outline-none transition-colors font-body"
									placeholder="••••••••"
									minlength="8"
									required
								/>
							</div>

							<button
								type="submit"
								class="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent-primary text-white hover:bg-accent-primary-light transition-all duration-150 font-display text-lg tracking-widest uppercase"
							>
								<LockKey weight="duotone" size={20} />
								Update Password
								<ArrowRight weight="bold" size={20} />
							</button>
						</form>
					{/if}
				</div>
			</div>
		</main>
	</div>
</div>
