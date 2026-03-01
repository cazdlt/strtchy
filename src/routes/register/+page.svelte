<script lang="ts">
	let { data, form } = $props();
	let username = $state('');
	let email = $state('');
	let password = $state('');
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black p-4">
	<div class="w-full max-w-md">
		<div class="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-8 border border-zinc-700">
			<h1 class="text-3xl font-bold text-white mb-2 text-center">Create Account</h1>
			<p class="text-zinc-400 mb-8 text-center">Join Strtchy to track your recovery journey</p>

			<form method="POST" class="space-y-4">
				{#if form?.missing}
					<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
						Please fill in all fields
					</div>
				{/if}

				{#if form && 'email' in form && form.email === 'already_exists'}
					<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
						An account with this email already exists
					</div>
				{/if}

				{#if form?.error}
					<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
						{form.error}
					</div>
				{/if}

				{#if form?.invalid}
					<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
						Invalid input provided
					</div>
				{/if}

				<div>
					<label for="username" class="block text-sm font-medium text-zinc-300 mb-2">Username</label>
					<input
						id="username"
						name="username"
						type="text"
						bind:value={username}
						class="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
						placeholder="johndoe"
						required
					/>
				</div>

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
						minlength="8"
					/>
					<p class="mt-1 text-xs text-zinc-500">Must be at least 8 characters</p>
				</div>

				<button
					type="submit"
					class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-800"
				>
					Create Account
				</button>
			</form>

			<p class="mt-6 text-center text-zinc-400 text-sm">
				Already have an account?
				<a href="/login" class="text-emerald-400 hover:text-emerald-300 font-medium">Sign in</a>
			</p>
		</div>
	</div>
</div>
