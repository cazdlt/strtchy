<script lang="ts">
	import { PersonSimple } from 'phosphor-svelte';
	import { theme } from '$lib/theme.svelte';
	import { movementArt } from '$lib/art';

	// Movement picture: the looping 3D preview (animated) or its still, falling
	// back to the stored illustration (SVG markup or an uploaded image).
	let {
		movement,
		animated = false,
		mirrored = false,
		class: className = ''
	}: {
		movement: { name: string; isCustom?: boolean | null; illustrationPath?: string | null };
		animated?: boolean;
		/** Flip horizontally, e.g. for the right side of a bilateral movement. */
		mirrored?: boolean;
		class?: string;
	} = $props();

	const art = $derived(movementArt(movement));
	const reducedMotion =
		typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
	const src = $derived(art ? ($theme === 'light' ? art.light : art.dark) : null);
</script>

{#if art && animated && !reducedMotion}
	<!-- The loop's background is baked in and equals the theme's base colour. -->
	{#key src}
		<video
			{src}
			poster={art.icon}
			autoplay
			loop
			muted
			playsinline
			aria-label={movement.name}
			class="bg-base object-contain transition-transform duration-300 {className}"
			style:transform={mirrored ? 'scaleX(-1)' : undefined}
		></video>
	{/key}
{:else if art}
	<img
		src={art.icon}
		alt={movement.name}
		loading="lazy"
		class="object-contain transition-transform duration-300 {className}"
		style:transform={mirrored ? 'scaleX(-1)' : undefined}
	/>
{:else if movement.illustrationPath?.startsWith('<svg')}
	<div class="text-text-muted {className}">{@html movement.illustrationPath}</div>
{:else if movement.illustrationPath}
	<img src={movement.illustrationPath} alt={movement.name} loading="lazy" class="object-contain {className}" />
{:else}
	<div class="flex items-center justify-center text-text-muted {className}">
		<PersonSimple weight="duotone" size={20} />
	</div>
{/if}
