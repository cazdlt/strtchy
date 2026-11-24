<script lang="ts">
	import PageHeader from '../../components/ui/PageHeader.svelte';
	import { ArrowRight, UserCirclePlus, Key, Copy, Check } from 'phosphor-svelte';
	
	let { form } = $props();
	let username = $state('');
	let email = $state('');
	let password = $state('');
	let copied = $state(false);

	function copyApiKey() {
		if (form?.apiKey) {
			navigator.clipboard.writeText(form.apiKey);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}
</script>

<svelte:head>
	<title>Create Account — Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-base relative overflow-hidden">
	<!-- Hero: a cast member stretching in a calm setting, faded into the page. -->
	<img
		src="/assets/hero/register.jpg"
		alt=""
		class="absolute inset-0 w-full h-full object-cover opacity-70 pointer-events-none select-none"
		style="object-position: 75% 80%;"
	/>
	<div class="absolute inset-0 bg-linear-to-r from-base via-base/80 to-base/10 pointer-events-none"></div>
	<div class="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-base to-transparent pointer-events-none"></div>
	<div class="relative">
	<PageHeader user={null} showNav={false} />

	<main class="flex-1 flex items-center justify-center px-6 py-12">
		<div class="w-full max-w-md">
			<!-- Card -->
			<div 
				class="bg-surface p-8 sm:p-10 border-t-4 border-t-accent-primary"
				style="box-shadow: var(--shadow-elevated);"
			>
				<!-- Header -->
				<div class="mb-8">
					<div class="flex items-baseline gap-3 mb-2">
						<span class="text-text-muted text-sm uppercase tracking-widest font-body">Get started</span>
						<div class="flex-1 h-px bg-accent-track"></div>
					</div>
					<h1 class="font-display text-4xl text-text-primary tracking-wide">
						CREATE ACCOUNT
					</h1>
				</div>

				{#if form?.success}
					<div class="space-y-6">
						<div class="bg-success/10 border border-success/20 px-4 py-3">
							<p class="text-success text-sm font-body">
								Account created successfully!
							</p>
						</div>

						{#if form?.apiKey}
							<div class="bg-accent-primary/10 border-2 border-accent-primary/30 p-4">
								<div class="flex items-start gap-3">
									<Key weight="duotone" size={20} class="text-accent-primary mt-0.5 shrink-0" />
									<div class="flex-1 min-w-0">
										<p class="text-accent-primary font-title text-sm mb-1">
											Your API Key
										</p>
										<p class="text-text-muted text-xs mb-3 font-body">
											Copy it now — it won't be shown again. You can rotate it anytime in your profile.
										</p>
										<div class="bg-inset p-3 font-mono text-sm text-accent-primary-light break-all mb-2">
											{form.apiKey}
										</div>
										<button
											type="button"
											onclick={copyApiKey}
											class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary/20 hover:bg-accent-primary/30 text-accent-primary border-2 border-accent-primary/50 transition-all duration-150 font-body text-sm"
										>
											{#if copied}
												<Check weight="bold" size={16} />
												Copied!
											{:else}
												<Copy weight="duotone" size={16} />
												Copy to clipboard
											{/if}
										</button>
									</div>
								</div>
							</div>
						{/if}

						<a
							href="/login?registered=true"
							class="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent-primary text-white hover:bg-accent-primary-light transition-all duration-150 font-display text-lg tracking-widest uppercase"
						>
							Continue to Sign In
							<ArrowRight weight="bold" size={20} />
						</a>
					</div>
				{:else}
				<form method="POST" class="space-y-5">
					<!-- Error Messages -->
					{#if form?.missing}
						<div class="bg-error/10 border border-error/20 px-4 py-3">
							<p class="text-error text-sm font-body">Please fill in all fields</p>
						</div>
					{/if}

				{#if form && 'email' in form && form.email === 'already_exists'}
					<div class="bg-error/10 border border-error/20 px-4 py-3">
						<p class="text-error text-sm font-body">An account with this email already exists</p>
					</div>
				{/if}

					{#if form?.error}
						<div class="bg-error/10 border border-error/20 px-4 py-3">
							<p class="text-error text-sm font-body">{form.error}</p>
						</div>
					{/if}

					{#if form?.invalid}
						<div class="bg-error/10 border border-error/20 px-4 py-3">
							<p class="text-error text-sm font-body">Invalid input provided</p>
						</div>
					{/if}

					<!-- Username -->
					<div>
						<label for="username" class="block text-sm font-body text-text-secondary mb-2 uppercase tracking-wider">
							Username
						</label>
						<input
							id="username"
							name="username"
							type="text"
							bind:value={username}
							class="w-full bg-inset text-text-primary border-2 border-accent-track px-4 py-3 focus:border-accent-primary focus:outline-none transition-colors font-body"
							placeholder="johndoe"
							required
						/>
					</div>

					<!-- Email -->
					<div>
						<label for="email" class="block text-sm font-body text-text-secondary mb-2 uppercase tracking-wider">
							Email
						</label>
						<input
							id="email"
							name="email"
							type="email"
							bind:value={email}
							class="w-full bg-inset text-text-primary border-2 border-accent-track px-4 py-3 focus:border-accent-primary focus:outline-none transition-colors font-body"
							placeholder="you@example.com"
							required
						/>
					</div>

					<!-- Password -->
					<div>
						<label for="password" class="block text-sm font-body text-text-secondary mb-2 uppercase tracking-wider">
							Password
						</label>
						<input
							id="password"
							name="password"
							type="password"
							bind:value={password}
							class="w-full bg-inset text-text-primary border-2 border-accent-track px-4 py-3 focus:border-accent-primary focus:outline-none transition-colors font-body"
							placeholder="••••••••"
							required
							minlength="8"
						/>
						<p class="mt-2 text-xs text-text-muted font-body">Must be at least 8 characters</p>
					</div>

					<!-- Submit -->
					<button
						type="submit"
						class="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent-primary text-white hover:bg-accent-primary-light transition-all duration-150 font-display text-lg tracking-widest uppercase"
					>
						<UserCirclePlus weight="duotone" size={20} />
						Create Account
						<ArrowRight weight="bold" size={20} />
					</button>
				</form>
				{/if}

				<!-- Footer -->
				<div class="mt-8 pt-6 border-t border-accent-track space-y-3">
					<p class="text-center text-text-muted text-sm font-body">
						Already have an account?
						<a href="/login" class="text-accent-primary hover:text-accent-primary-light transition-colors font-semibold">
							Sign in
						</a>
					</p>
					<p class="text-center text-text-muted text-xs font-body">
						By continuing, you agree to our
						<a href="/terms" class="text-text-secondary hover:text-accent-primary underline transition-colors">Terms of Service</a>
						and
						<a href="/privacy" class="text-text-secondary hover:text-accent-primary underline transition-colors">Privacy Policy</a>.
					</p>
				</div>
			</div>
		</div>
	</main>
	</div>
</div>
