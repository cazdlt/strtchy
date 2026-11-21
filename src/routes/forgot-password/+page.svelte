<script lang="ts">
	import PageHeader from '../../components/ui/PageHeader.svelte';
	import { ArrowRight, EnvelopeSimple } from 'phosphor-svelte';

	let { form } = $props();
	let email = $state('');
</script>

<svelte:head>
	<title>Forgot Password — Strtchy</title>
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
							FORGOT PASSWORD
						</h1>
					</div>

					{#if form?.success}
						<div class="space-y-6">
							<div class="bg-success/10 border border-success/20 px-4 py-3">
								<p class="text-success text-sm font-body">{form.message}</p>
							</div>
							<a
								href="/login"
								class="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent-primary text-white hover:bg-accent-primary-light transition-all duration-150 font-display text-lg tracking-widest uppercase"
							>
								Back to Sign In
								<ArrowRight weight="bold" size={20} />
							</a>
						</div>
					{:else}
						<form method="POST" class="space-y-5">
							{#if form?.missing}
								<div class="bg-error/10 border border-error/20 px-4 py-3">
									<p class="text-error text-sm font-body">Please enter your email address</p>
								</div>
							{/if}

							{#if form?.error}
								<div class="bg-error/10 border border-error/20 px-4 py-3">
									<p class="text-error text-sm font-body">{form.error}</p>
								</div>
							{/if}

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

							<button
								type="submit"
								class="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent-primary text-white hover:bg-accent-primary-light transition-all duration-150 font-display text-lg tracking-widest uppercase"
							>
								<EnvelopeSimple weight="duotone" size={20} />
								Send Reset Link
								<ArrowRight weight="bold" size={20} />
							</button>
						</form>
					{/if}

					<div class="mt-8 pt-6 border-t border-accent-track">
						<p class="text-center text-text-muted text-sm font-body">
							Remember your password?
							<a href="/login" class="text-accent-primary hover:text-accent-primary-light transition-colors font-semibold">
								Sign in
							</a>
						</p>
					</div>
				</div>
			</div>
		</main>
	</div>
</div>
