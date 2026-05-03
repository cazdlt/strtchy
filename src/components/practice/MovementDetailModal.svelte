<script lang="ts">
	import {
		ArrowsLeftRight,
		Barbell,
		PersonSimple,
		Stack,
		Timer,
		X,
	} from 'phosphor-svelte';

	interface Movement {
		id: string;
		name: string;
		description: string | null;
		type: string;
		isBilateral: boolean | null;
		isCustom: boolean | null;
		illustrationPath: string | null;
		equipment: string[] | null;
		metadata: {
			defaultTarget?: {
				value: number;
				unit?: string;
			} | null;
		} | null;
		weightUnit: string | null;
		timePerRep: number | null;
		switchSidesDuration: number | null;
	}

	let {
		movement,
		isOpen,
		onClose,
	}: {
		movement: Movement | null;
		isOpen: boolean;
		onClose: () => void;
	} = $props();

	function formatTarget(m: Movement) {
		if (!m.metadata?.defaultTarget) return null;
		const { value, unit } = m.metadata.defaultTarget;
		return `${value} ${unit || ''}`;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && movement}
	<div
		class="fixed inset-0 bg-base/95 backdrop-blur z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
	>
		<div
			class="bg-surface border-t-4 border-t-accent-primary max-w-2xl w-full my-4 sm:my-0 flex flex-col"
			style="box-shadow: var(--shadow-floating);"
		>
			<!-- Header -->
			<div class="flex items-start justify-between p-6 border-b border-accent-track">
				<div>
					<span class="font-body text-text-muted text-xs uppercase tracking-widest">Movement</span>
					<h2 class="font-display text-3xl text-text-primary tracking-wide leading-tight mt-1">
						{movement.name.toUpperCase()}
					</h2>
				</div>
				<button
					onclick={onClose}
					class="p-2 bg-surface-elevated hover:bg-accent-track text-text-secondary hover:text-text-primary transition-colors shrink-0"
					aria-label="Close"
				>
					<X weight="bold" size={18} />
				</button>
			</div>

			<!-- Content -->
			<div class="p-6 space-y-6 overflow-y-auto">
				<!-- Illustration -->
				{#if movement.illustrationPath}
					<div
						class="relative bg-surface-elevated border-2 border-accent-track p-6 flex items-center justify-center"
					>
						<!-- Corner accents -->
						<div class="absolute top-0 left-0 w-3 h-3 bg-accent-primary"></div>
						<div class="absolute top-0 right-0 w-3 h-3 bg-accent-primary"></div>
						<div class="absolute bottom-0 left-0 w-3 h-3 bg-accent-primary"></div>
						<div class="absolute bottom-0 right-0 w-3 h-3 bg-accent-primary"></div>

						{#if movement.illustrationPath.startsWith('<svg')}
							<div class="w-32 h-32 text-text-muted">
								{@html movement.illustrationPath}
							</div>
						{:else}
							<img
								src={movement.illustrationPath}
								alt={movement.name}
								class="w-32 h-32 object-contain"
							/>
						{/if}
					</div>
				{/if}

				<!-- Description -->
				{#if movement.description}
					<section class="bg-surface-elevated p-4 border-l-4 border-l-accent-warm">
						<h3 class="font-display text-sm text-text-primary tracking-wider mb-2 uppercase">
							Description
						</h3>
						<p class="font-body text-text-secondary leading-relaxed text-sm">
							{movement.description}
						</p>
					</section>
				{/if}

				<!-- Details Grid -->
				<section class="border-t-2 border-accent-track pt-4">
					<h3 class="font-display text-sm text-text-primary tracking-wider mb-4 uppercase">
						Details
					</h3>
					<div class="space-y-3">
						<!-- Type -->
						<div class="flex items-center justify-between py-2 border-b border-accent-track/50">
							<span class="font-body text-text-muted uppercase tracking-wider text-xs">Type</span>
							<span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-surface-elevated text-text-secondary text-xs font-body uppercase tracking-wider border border-accent-track">
								{#if movement.type === 'timed'}
									<Timer weight="duotone" size={12} class="text-accent-primary" />
								{:else if movement.type === 'reps'}
									<Stack weight="duotone" size={12} class="text-accent-primary" />
								{:else if movement.type === 'weighted'}
									<Barbell weight="duotone" size={12} class="text-accent-primary" />
								{:else}
									<PersonSimple weight="duotone" size={12} class="text-accent-primary" />
								{/if}
								{movement.type}
							</span>
						</div>

						<!-- Default Target -->
						{#if formatTarget(movement)}
							<div class="flex items-center justify-between py-2 border-b border-accent-track/50">
								<span class="font-body text-text-muted uppercase tracking-wider text-xs">Default Target</span>
								<div class="flex items-baseline gap-1">
									<span class="font-display text-xl text-accent-primary">{movement.metadata?.defaultTarget?.value}</span>
									<span class="font-body text-xs text-text-secondary">{movement.metadata?.defaultTarget?.unit || ''}</span>
								</div>
							</div>
						{/if}

						<!-- Bilateral -->
						{#if movement.isBilateral}
							<div class="flex items-center justify-between py-2 border-b border-accent-track/50">
								<span class="font-body text-text-muted uppercase tracking-wider text-xs">Switch Sides</span>
								<div class="flex items-baseline gap-1">
									<span class="font-display text-xl text-accent-warm">{movement.switchSidesDuration ?? 5}</span>
									<span class="font-body text-xs text-text-secondary">s</span>
								</div>
							</div>
						{/if}

						<!-- Weight Unit -->
						{#if movement.type === 'weighted' && movement.weightUnit}
							<div class="flex items-center justify-between py-2 border-b border-accent-track/50">
								<span class="font-body text-text-muted uppercase tracking-wider text-xs">Weight Unit</span>
								<span class="font-body text-xs text-accent-primary uppercase">{movement.weightUnit}</span>
							</div>
						{/if}

						<!-- Time Per Rep -->
						{#if movement.timePerRep && movement.type !== 'timed'}
							<div class="flex items-center justify-between py-2">
								<span class="font-body text-text-muted uppercase tracking-wider text-xs">Time Per Rep</span>
								<div class="flex items-baseline gap-1">
									<span class="font-display text-xl text-accent-secondary">{movement.timePerRep}</span>
									<span class="font-body text-xs text-text-secondary">s</span>
								</div>
							</div>
						{/if}
					</div>
				</section>

				<!-- Equipment -->
				{#if movement.equipment && movement.equipment.length > 0}
					<section class="border-t-2 border-accent-track pt-4">
						<h3 class="font-display text-sm text-text-primary tracking-wider mb-3 uppercase">
							Equipment
						</h3>
						<div class="flex flex-wrap gap-2">
							{#each movement.equipment as item}
								<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated border border-accent-track text-text-secondary text-sm">
									<Barbell weight="duotone" size={12} class="text-accent-primary" />
									<span class="font-body text-sm">{item}</span>
								</span>
							{/each}
						</div>
					</section>
				{/if}

				<!-- Tags -->
				<div class="flex flex-wrap gap-2 pt-2">
					{#if movement.isBilateral}
						<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-accent-track text-text-secondary text-sm">
							<ArrowsLeftRight weight="duotone" size={12} class="text-accent-secondary" />
							<span class="font-body text-xs uppercase tracking-wider">Bilateral</span>
						</span>
					{/if}
					{#if movement.isCustom}
						<span class="inline-flex items-center px-3 py-1.5 bg-surface-elevated border border-accent-primary/30 text-accent-primary text-sm">
							<span class="font-body text-xs uppercase tracking-wider">Custom</span>
						</span>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
