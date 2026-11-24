<script lang="ts">
	import PageHeader from '../../components/ui/PageHeader.svelte';
</script>

<svelte:head>
	<title>Privacy Policy — Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-base text-text-primary flex flex-col">
	<PageHeader user={null} showNav={false} backUrl="/" backText="Home" />

	<main class="flex-1 max-w-3xl w-full mx-auto px-6 sm:px-8 py-12">
		<div class="mb-10 pb-6 border-b-2 border-accent-track">
			<div class="flex items-center gap-4 mb-3">
				<span class="font-mono text-xs text-accent-primary uppercase tracking-widest">Legal</span>
				<div class="flex-1 h-px bg-accent-track"></div>
				<span class="font-mono text-xs text-text-muted uppercase tracking-widest">Effective Nov 2026</span>
			</div>
			<h1 class="font-display text-5xl sm:text-6xl text-text-primary tracking-wide leading-none">
				PRIVACY POLICY
			</h1>
			<p class="font-body text-sm text-text-muted mt-3">
				How Strtchy collects, stores, and protects your information.
			</p>
		</div>

		<div
			class="bg-surface p-6 sm:p-10 border-t-4 border-t-accent-primary space-y-8"
			style="box-shadow: var(--shadow-elevated);"
		>
			<section class="space-y-2 pb-6 border-b border-accent-track">
				<h2 class="font-display text-2xl text-text-primary tracking-wider">
					01. INFORMATION WE COLLECT
				</h2>
				<p class="font-body text-sm sm:text-base text-text-secondary leading-relaxed">
					When you create an account, we collect your name/username and email address along with a
					securely hashed password. As you use Strtchy, we store the practice logs, session
					durations, ratings, and custom routines or movements you create.
				</p>
			</section>

			<section class="space-y-2 pb-6 border-b border-accent-track">
				<h2 class="font-display text-2xl text-text-primary tracking-wider">
					02. DATA STORAGE
				</h2>
				<p class="font-body text-sm sm:text-base text-text-secondary leading-relaxed">
					Your account details, custom routines, custom movements, and practice history are stored
					in our SQLite database solely to run the application and keep your training history
					available across sessions. We do not sell, rent, or trade your personal data to third
					parties.
				</p>
			</section>

			<section class="space-y-2 pb-6 border-b border-accent-track">
				<h2 class="font-display text-2xl text-text-primary tracking-wider">
					03. STRICTLY NECESSARY COOKIES ONLY
				</h2>
				<p class="font-body text-sm sm:text-base text-text-secondary leading-relaxed">
					Strtchy uses only strictly necessary, first-party cookies required for core functionality:
					an authentication session cookie when you sign in, and a temporary guest session cookie
					when you practice without an account so your session can be saved if you choose to
					register. We do <strong class="text-text-primary">not</strong> use third-party advertising
					cookies, cross-site trackers, or invasive behavioral tracking.
				</p>
			</section>

			<section class="space-y-2 pb-6 border-b border-accent-track">
				<h2 class="font-display text-2xl text-text-primary tracking-wider">
					04. TRANSACTIONAL EMAIL
				</h2>
				<p class="font-body text-sm sm:text-base text-text-secondary leading-relaxed">
					We use your email address only for essential transactional messages—such as password reset
					links and critical account security notices. We do not send unsolicited marketing emails.
				</p>
			</section>

			<section class="space-y-2 pb-6 border-b border-accent-track">
				<h2 class="font-display text-2xl text-text-primary tracking-wider">
					05. YOUR RIGHTS &amp; ACCOUNT DELETION
				</h2>
				<p class="font-body text-sm sm:text-base text-text-secondary leading-relaxed">
					You are in control of your data. You can permanently delete your account—along with your
					associated practice logs and custom routines—at any time directly from your
					<a href="/profile" class="text-accent-primary hover:text-accent-primary-light underline">Profile</a>
					page.
				</p>
			</section>

			<section class="space-y-2">
				<h2 class="font-display text-2xl text-text-primary tracking-wider">
					06. CONTACT
				</h2>
				<p class="font-body text-sm sm:text-base text-text-secondary leading-relaxed">
					If you have any questions about this Privacy Policy or how your data is handled, contact
					us at <span class="font-mono text-accent-primary">support@strtchy.com</span>.
				</p>
			</section>
		</div>

		<div class="mt-8 flex items-center justify-between text-xs font-body uppercase tracking-wider text-text-muted">
			<a href="/" class="hover:text-accent-primary transition-colors">← Back to Home</a>
			<a href="/terms" class="hover:text-accent-primary transition-colors">Terms of Service →</a>
		</div>
	</main>

	<footer class="border-t-2 border-accent-track">
		<div class="max-w-5xl mx-auto px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
			<span class="font-display text-lg tracking-wider text-text-primary">STRTCHY</span>
			<nav class="flex items-center gap-6 text-xs font-body uppercase tracking-wider text-text-muted">
				<a href="/" class="hover:text-accent-primary transition-colors">Home</a>
				<a href="/routines" class="hover:text-accent-primary transition-colors">Routines</a>
				<a href="/terms" class="hover:text-accent-primary transition-colors">Terms</a>
			</nav>
		</div>
	</footer>
</div>
