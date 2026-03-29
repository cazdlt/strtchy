<script lang="ts">
	import PageHeader from '../../components/ui/PageHeader.svelte';
	import { ArrowRight, UserCirclePlus } from 'phosphor-svelte';
	
	let { data, form } = $props();
	let username = $state('');
	let email = $state('');
	let password = $state('');
</script>

<svelte:head>
	<title>Create Account — Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-base">
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

				<!-- Footer -->
				<div class="mt-8 pt-6 border-t border-accent-track">
					<p class="text-center text-text-muted text-sm font-body">
						Already have an account?
						<a href="/login" class="text-accent-primary hover:text-accent-primary-light transition-colors font-semibold">
							Sign in
						</a>
					</p>
				</div>
			</div>
		</div>
	</main>
</div>
