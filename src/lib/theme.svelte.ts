import { writable } from 'svelte/store';

// Theme type
type Theme = 'dark' | 'light';

// Check if we're in the browser
const isBrowser = typeof window !== 'undefined';

// Get initial theme from localStorage or system preference
function getInitialTheme(): Theme {
	if (!isBrowser) return 'dark';
	
	// Check localStorage first
	const stored = localStorage.getItem('strtchy-theme') as Theme | null;
	if (stored && (stored === 'dark' || stored === 'light')) {
		return stored;
	}
	
	// Fall back to system preference
	if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
		return 'light';
	}
	
	return 'dark';
}

// Create the store
function createThemeStore() {
	const initialTheme = getInitialTheme();
	const { subscribe, set } = writable<Theme>(initialTheme);
	
	// Apply theme to document immediately
	if (isBrowser) {
		applyTheme(initialTheme);
	}
	
	return {
		subscribe,
		toggle: () => {
			if (!isBrowser) return;
			
			const currentTheme = document.documentElement.classList.contains('theme-light') ? 'light' : 'dark';
			const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
			
			applyTheme(newTheme);
			set(newTheme);
			localStorage.setItem('strtchy-theme', newTheme);
		},
		set: (theme: Theme) => {
			if (!isBrowser) return;
			
			applyTheme(theme);
			set(theme);
			localStorage.setItem('strtchy-theme', theme);
		}
	};
}

// Apply theme class to document
function applyTheme(theme: Theme) {
	if (!isBrowser) return;
	
	if (theme === 'light') {
		document.documentElement.classList.add('theme-light');
	} else {
		document.documentElement.classList.remove('theme-light');
	}
}

export const theme = createThemeStore();

// Initialize theme on mount
export function initTheme() {
	if (!isBrowser) return;
	
	const stored = localStorage.getItem('strtchy-theme') as Theme | null;
	if (stored && (stored === 'dark' || stored === 'light')) {
		applyTheme(stored);
		theme.set(stored);
	}
}
