<script lang="ts">
	let { data, form } = $props();
	let email = $state('');
	let password = $state('');
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
