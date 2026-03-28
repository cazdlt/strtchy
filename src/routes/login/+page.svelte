<script lang="ts">
	let { data, form } = $props();
	let email = $state('');
	let password = $state('');
	let copied = $state(false);
	
	function copyApiKey() {
		if (data.apiKey) {
			navigator.clipboard.writeText(data.apiKey);
			copied = true;
			setTimeout(() => copied = false, 2000);
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black p-4">
	<div class="w-full max-w-md">
		<div class="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-8 border border-zinc-700">
			<div class="text-center mb-8">
				<div class="inline-flex items-center justify-center w-16 h-16 bg-emerald-600/20 rounded-full mb-4">
					<svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
					</svg>
				</div>
				<h1 class="text-3xl font-bold text-white mb-2">Welcome back</h1>
				<p class="text-zinc-400">Sign in to continue your recovery journey</p>
			</div>

			{#if data.registered}
				<div class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg text-sm mb-4">
					Account created successfully! Please sign in.
				</div>
			{/if}
			
			{#if data.apiKey}
				<div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
					<div class="flex items-start gap-3">
						<svg class="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
						</svg>
						<div class="flex-1 min-w-0">
							<p class="text-blue-400 font-semibold text-sm mb-2">
								Your API Key
							</p>
							<p class="text-blue-300 text-xs mb-3">
								This is your API key for programmatic access. Copy it now - it won't be shown again!
							</p>
							<div class="bg-zinc-900/80 rounded-lg p-3 font-mono text-sm text-blue-300 break-all mb-2">
								{data.apiKey}
							</div>
							<button
								onclick={copyApiKey}
								class="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/50 rounded-lg py-2 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-2"
							>
								{#if copied}
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
									Copied!
								{:else}
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
									</svg>
									Copy to clipboard
								{/if}
							</button>
						</div>
					</div>
				</div>
			{/if}

			<form method="POST" class="space-y-4">
				{#if form?.missing}
					<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
						Please fill in all fields
					</div>
				{/if}

				{#if form?.credentials}
					<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
						Invalid email or password
					</div>
				{/if}

				{#if form?.invalid}
					<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
						Invalid input provided
					</div>
				{/if}

				<div>
					<label for="email" class="block text-sm font-medium text-zinc-300 mb-2">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						bind:value={email}
						class="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
						placeholder="john@example.com"
						required
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-zinc-300 mb-2">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						bind:value={password}
						class="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
						placeholder="••••••••"
						required
					/>
				</div>

				<button
					type="submit"
					class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-800"
				>
					Sign In
				</button>
			</form>

			<p class="mt-6 text-center text-zinc-400 text-sm">
				Don't have an account?
				<a href="/register" class="text-emerald-400 hover:text-emerald-300 font-medium">Create one</a>
			</p>
		</div>
	</div>
</div>
