<script lang="ts">
	import PageHeader from '../../components/ui/PageHeader.svelte';
	import { ArrowRight, UserCircle } from 'phosphor-svelte';
	
	let { data, form } = $props();
	let email = $state('');
	let password = $state('');
</script>

<svelte:head>
	<title>Sign In — Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-base relative overflow-hidden">
	<!-- Hero: a cast member stretching in a calm setting, faded into the page. -->
	<img
		src="/assets/hero/login.jpg"
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
						<span class="text-text-muted text-sm uppercase tracking-widest font-body">Welcome back</span>
						<div class="flex-1 h-px bg-accent-track"></div>
					</div>
					<h1 class="font-display text-4xl text-text-primary tracking-wide">
						SIGN IN
					</h1>
				</div>

				<!-- Success Messages -->
				{#if data.registered}
					<div class="mb-6 bg-success/10 border border-success/20 px-4 py-3">
						<p class="text-success text-sm font-body">Account created successfully! Please sign in.</p>
					</div>
				{/if}

				{#if data.reset}
					<div class="mb-6 bg-success/10 border border-success/20 px-4 py-3">
						<p class="text-success text-sm font-body">Password reset successfully! Please sign in with your new password.</p>
					</div>
				{/if}

				<form method="POST" class="space-y-5">
					<input type="hidden" name="redirectTo" value={data.redirectTo} />
					<!-- Error Messages -->
					{#if form?.missing}
						<div class="bg-error/10 border border-error/20 px-4 py-3">
							<p class="text-error text-sm font-body">Please fill in all fields</p>
						</div>
					{/if}

					{#if form?.credentials}
						<div class="bg-error/10 border border-error/20 px-4 py-3">
							<p class="text-error text-sm font-body">Invalid email or password</p>
						</div>
					{/if}

					{#if form?.invalid}
						<div class="bg-error/10 border border-error/20 px-4 py-3">
							<p class="text-error text-sm font-body">Invalid input provided</p>
						</div>
					{/if}

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
						<div class="flex items-center justify-between mb-2">
							<label for="password" class="block text-sm font-body text-text-secondary uppercase tracking-wider">
								Password
							</label>
							<a href="/forgot-password" class="text-xs font-body text-accent-primary hover:text-accent-primary-light transition-colors">
								Forgot password?
							</a>
						</div>
						<input
							id="password"
							name="password"
							type="password"
							bind:value={password}
							class="w-full bg-inset text-text-primary border-2 border-accent-track px-4 py-3 focus:border-accent-primary focus:outline-none transition-colors font-body"
							placeholder="••••••••"
							required
						/>
					</div>

					<!-- Submit -->
					<button
						type="submit"
						class="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent-primary text-white hover:bg-accent-primary-light transition-all duration-150 font-display text-lg tracking-widest uppercase"
					>
						<UserCircle weight="duotone" size={20} />
						Sign In
						<ArrowRight weight="bold" size={20} />
					</button>
				</form>

				<!-- Footer -->
				<div class="mt-8 pt-6 border-t border-accent-track space-y-3">
					<p class="text-center text-text-muted text-sm font-body">
						Don't have an account?
						<a href="/register" class="text-accent-primary hover:text-accent-primary-light transition-colors font-semibold">
							Create one
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
