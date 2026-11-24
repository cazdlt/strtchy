<script lang="ts">
	import PageHeader from '../../components/ui/PageHeader.svelte';
</script>

<svelte:head>
	<title>Terms of Service — Strtchy</title>
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
				TERMS OF SERVICE
			</h1>
			<p class="font-body text-sm text-text-muted mt-3">
				Please read these terms carefully before using Strtchy.
			</p>
		</div>

		<div
			class="bg-surface p-6 sm:p-10 border-t-4 border-t-accent-primary space-y-8"
			style="box-shadow: var(--shadow-elevated);"
		>
			<section class="space-y-2 pb-6 border-b border-accent-track">
				<h2 class="font-display text-2xl text-text-primary tracking-wider">
					01. HEALTH &amp; FITNESS DISCLAIMER
				</h2>
				<p class="font-body text-sm sm:text-base text-text-secondary leading-relaxed">
					Strtchy provides guided stretching and mobility routines for general informational and
					personal fitness purposes only. Nothing in the app constitutes medical advice, diagnosis,
					or physical therapy treatment. Always consult a qualified physician or healthcare provider
					before starting a new stretching or exercise program, especially if you have an existing
					injury or medical condition. Stop immediately if you experience sharp pain, dizziness, or
					unusual discomfort.
				</p>
			</section>

			<section class="space-y-2 pb-6 border-b border-accent-track">
				<h2 class="font-display text-2xl text-text-primary tracking-wider">
					02. ACCEPTABLE USE
				</h2>
				<p class="font-body text-sm sm:text-base text-text-secondary leading-relaxed">
					You agree to use Strtchy only for lawful, personal, non-commercial purposes. You must not
					attempt to disrupt the service, bypass authentication or rate limits, scrape data
					automatically, or interfere with other users' access to the platform.
				</p>
			</section>

			<section class="space-y-2 pb-6 border-b border-accent-track">
				<h2 class="font-display text-2xl text-text-primary tracking-wider">
					03. USER-GENERATED ROUTINES &amp; MOVEMENTS
				</h2>
				<p class="font-body text-sm sm:text-base text-text-secondary leading-relaxed">
					When you create custom movements or routines in Strtchy, you retain ownership of the
					content you create. You are solely responsible for ensuring your custom routines are
					appropriate for your own physical condition and do not infringe upon any third-party
					intellectual property or rights.
				</p>
			</section>

			<section class="space-y-2 pb-6 border-b border-accent-track">
				<h2 class="font-display text-2xl text-text-primary tracking-wider">
					04. ACCOUNT TERMINATION
				</h2>
				<p class="font-body text-sm sm:text-base text-text-secondary leading-relaxed">
					You may stop using Strtchy and permanently delete your account at any time from your
					<a href="/profile" class="text-accent-primary hover:text-accent-primary-light underline">Profile</a>
					page. We reserve the right to suspend or terminate accounts that violate these terms,
					abuse the service, or pose a security risk.
				</p>
			</section>

			<section class="space-y-2 pb-6 border-b border-accent-track">
				<h2 class="font-display text-2xl text-text-primary tracking-wider">
					05. LIMITATION OF LIABILITY
				</h2>
				<p class="font-body text-sm sm:text-base text-text-secondary leading-relaxed">
					Strtchy is provided on an "as is" and "as available" basis without warranties of any kind,
					express or implied. To the fullest extent permitted by applicable law, Strtchy and its
					operators shall not be liable for any physical injury, data loss, or indirect, incidental,
					or consequential damages arising from your use of the service.
				</p>
			</section>

			<section class="space-y-2">
				<h2 class="font-display text-2xl text-text-primary tracking-wider">
					06. CHANGES &amp; CONTACT
				</h2>
				<p class="font-body text-sm sm:text-base text-text-secondary leading-relaxed">
					We may update these Terms of Service from time to time. Continued use of Strtchy after
					changes take effect constitutes acceptance of the revised terms. If you have questions
					about these terms, contact us at
					<span class="font-mono text-accent-primary">support@strtchy.com</span>.
				</p>
			</section>
		</div>

		<div class="mt-8 flex items-center justify-between text-xs font-body uppercase tracking-wider text-text-muted">
			<a href="/" class="hover:text-accent-primary transition-colors">← Back to Home</a>
			<a href="/privacy" class="hover:text-accent-primary transition-colors">Privacy Policy →</a>
		</div>
	</main>

	<footer class="border-t-2 border-accent-track">
		<div class="max-w-5xl mx-auto px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
			<span class="font-display text-lg tracking-wider text-text-primary">STRTCHY</span>
			<nav class="flex items-center gap-6 text-xs font-body uppercase tracking-wider text-text-muted">
				<a href="/" class="hover:text-accent-primary transition-colors">Home</a>
				<a href="/routines" class="hover:text-accent-primary transition-colors">Routines</a>
				<a href="/privacy" class="hover:text-accent-primary transition-colors">Privacy</a>
			</nav>
		</div>
	</footer>
</div>
