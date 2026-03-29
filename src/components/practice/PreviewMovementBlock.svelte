<script lang="ts">
	import SetRow from './SetRow.svelte';
	import RestRow from './RestRow.svelte';

	let {
		movementIndex,
		routineMovementId,
		movementName,
		movementType,
		description,
		targetValue,
		sets,
		isBilateral,
		switchSidesDuration,
		weight = null,
		weightUnit = null,
		notes = null,
		restBetweenSetsDuration = 0,
		previousStats = null
	} = $props<{
		movementIndex: number;
		routineMovementId: string;
		movementName: string;
		movementType: 'timed' | 'reps' | 'weighted' | 'resistance_band';
		description?: string | null;
		targetValue: number;
		sets: number;
		isBilateral: boolean;
		switchSidesDuration: number;
		weight?: number | null;
		weightUnit?: string | null;
		notes?: string | null;
		restBetweenSetsDuration?: number;
		previousStats?: any;
	}>();

	let collapsed = $state(false);

	function generateItems() {
		const result: Array<{
			type: 'set' | 'rest';
			setNumber?: number;
			side?: 'left' | 'right' | null;
			restType?: 'switch-sides' | 'between-sets';
			duration?: number;
			label?: string;
			key: string;
		}> = [];

		for (let i = 1; i <= sets; i++) {
			if (isBilateral) {
				// Left side
				result.push({ type: 'set', setNumber: i, side: 'left', key: `${i}L` });

				// Switch sides rest
				if (switchSidesDuration > 0) {
					result.push({
						type: 'rest',
						restType: 'switch-sides',
						duration: switchSidesDuration,
						label: 'Switch Sides',
						key: `${i}-switch`,
						setNumber: i,
						side: 'left'
					});
				}

				// Right side
				result.push({ type: 'set', setNumber: i, side: 'right', key: `${i}R` });
			} else {
				result.push({ type: 'set', setNumber: i, side: null, key: `${i}` });
			}

			// Rest between sets
			if (i < sets && restBetweenSetsDuration > 0) {
				result.push({
					type: 'rest',
					restType: 'between-sets',
					duration: restBetweenSetsDuration,
					label: 'Rest between sets',
					key: `${i}-rest`,
					setNumber: i
				});
			}
		}

		return result;
	}

	const items = $derived(generateItems());
</script>

<div class="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden mb-4">
	<div class="w-full p-4 flex items-start gap-3">
		<div class="flex flex-col items-center flex-shrink-0">
			<button
				onclick={() => (collapsed = !collapsed)}
				class="w-10 h-10 bg-gray-700/80 flex items-center justify-center text-sm font-semibold text-white hover:bg-gray-600 transition-colors"
				aria-label={collapsed ? 'Expand' : 'Collapse'}
			>
				{movementIndex + 1}
			</button>
		</div>
		<button
			onclick={() => (collapsed = !collapsed)}
			class="flex-1 min-w-0 text-left hover:bg-gray-700/30 transition-colors rounded-lg p-2 -m-2"
		>
			<div class="flex items-center gap-2 flex-wrap">
				<h3 class="font-semibold text-white">{movementName}</h3>
				<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700/80 text-gray-300">
					{movementType}
				</span>
				{#if isBilateral}
					<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/50 text-blue-400">
						L/R
					</span>
				{/if}
			</div>
			{#if description}
				<p class="text-gray-400 text-sm mt-1 line-clamp-2">{description}</p>
			{/if}
		</button>
		<button
			onclick={() => (collapsed = !collapsed)}
			class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
			aria-label={collapsed ? 'Expand' : 'Collapse'}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				class="w-5 h-5 transition-transform {collapsed ? 'rotate-180' : ''}"
			>
				<path fill-rule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 011.06 1.06l-7.5 7.5z" clip-rule="evenodd" />
			</svg>
		</button>
	</div>

	{#if !collapsed}
		<div class="border-t border-gray-700 p-2 space-y-2">
			<!-- Notes Section -->
			{#if notes}
				<div class="px-2 pb-2 mb-2 border-b border-gray-700/50">
					<div class="flex items-center gap-2 mb-1">
						<span class="text-[10px] font-bold uppercase tracking-wider text-gray-500">Notes</span>
					</div>
					<p class="text-sm text-gray-300 italic">"{notes}"</p>
				</div>
			{/if}

			{#each items as item (item.key)}
				{#if item.type === 'set'}
					<SetRow
						setNumber={item.setNumber!}
						{movementType}
						{targetValue}
						{weight}
						{weightUnit}
						isBilateral={isBilateral}
						side={item.side!}
						previousStats={Array.isArray(previousStats) 
							? previousStats.find(ps => ps.setNumber === item.setNumber && (ps.side || null) === (item.side || null)) 
							: previousStats}
						isActive={false}
						isCompleted={false}
						isSkipped={false}
						isPreview={true}
					/>
				{:else}
					<RestRow
						label={item.label}
						duration={item.duration!}
						isActive={false}
						isCompleted={false}
						isPreview={true}
					/>
				{/if}
			{/each}
		</div>
	{/if}
</div>
