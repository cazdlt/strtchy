export function scrollToElement(elementId: string, behavior: ScrollBehavior = 'smooth', block: ScrollLogicalPosition = 'center') {
	setTimeout(() => {
		const element = document.getElementById(elementId);
		if (element) {
			element.scrollIntoView({ behavior, block });
		}
	}, 100);
}

export function scrollToSet(routineMovementId: string, setNumber: number, side: 'left' | 'right' | null) {
	const key = `${routineMovementId}-${setNumber}-${side || 'none'}`;
	scrollToElement(`set-${key}`);
}

export function highlightElement(elementId: string, duration = 2000) {
	const element = document.getElementById(elementId);
	if (element) {
		element.classList.add('ring-2', 'ring-blue-500');
		setTimeout(() => {
			element.classList.remove('ring-2', 'ring-blue-500');
		}, duration);
	}
}

export function scrollAndHighlightSet(
	routineMovementId: string,
	setNumber: number,
	side: 'left' | 'right' | null,
	highlightDuration = 2000
) {
	const key = `${routineMovementId}-${setNumber}-${side || 'none'}`;
	const elementId = `set-${key}`;
	
	scrollToElement(elementId);
	highlightElement(elementId, highlightDuration);
}
