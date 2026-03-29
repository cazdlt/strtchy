# Strtchy Zen Athletic 80s Design System

## Design Philosophy: "Zen Athletic 80s"

**Core Concept**: A warm, human take on 80s athletic aesthetics - the precision of Nike's 1984 campaign meeting the honest utility of old school gymnasiums. Think: geometric without coldness, structured without stiffness, retro without pastiche.

**Key Principles**:
- **Human Precision**: Geometric shapes with organic imperfections (slight texture, warm neutrals)
- **Quiet Confidence**: Bold structures with soft, approachable details
- **Nostalgic Warmth**: 80s nostalgia filtered through modern minimalism
- **Anti-Corporate**: No sterile greys, no cold blues, no rigid uniformity

**Mood**: Late afternoon light in an empty gymnasium, track shoes on hardwood, chalk dust, warm vinyl, the satisfying clunk of metal weights.

---

## Color Palette

### Dark Mode: "Evening Practice"
The vibe: Post-workout, lights low, that golden-tinged blue of dusk through gym windows.

**CSS Variables**:
```
--color-base: #1a1a1a (Warm charcoal, not cold black)
--color-surface: #252525 (Lifts for cards, modals)
--color-surface-elevated: #303030 (Hover states, active items)
--color-inset: #141414 (Input backgrounds, recessed areas)

--color-text-primary: #f5f3f0 (Warm cream white, not pure white)
--color-text-secondary: #a8a5a0 (Muted warm grey)
--color-text-muted: #6b6965 (Subtle grey for hints)

--color-accent-blue: #5b8db8 (Retro athletic blue - muted, warm)
--color-accent-blue-light: #8ab4d9 (Highlight blue)
--color-accent-cream: #e8e4dd (Warm cream accent)
--color-accent-warm: #c9a87c (Gymnasium wood tone)
--color-accent-track: #3d3d3d (Track line grey)

--color-success: #7aa87a (Muted sage green, not neon emerald)
--color-warning: #c9a35a (Warm amber)
--color-error: #b87a7a (Muted terracotta red)
```

**Usage**:
- Base: Main backgrounds
- Surface: Cards, sections, containers
- Text-primary: Headlines, primary content
- Accent-blue: CTAs, active states, links
- Accent-cream: Highlights, borders, subtle backgrounds
- Track color: Gymnasium-inspired horizontal rules, separators

### Light Mode: "Morning Practice"
The vibe: Early morning light, fresh start, the calm before the day begins.

**CSS Variables**:
```
--color-base: #f7f5f0 (Warm cream, not stark white)
--color-surface: #ffffff (Pure white for cards)
--color-surface-elevated: #ffffff (Shadows give elevation)
--color-inset: #ede9e2 (Input backgrounds)

--color-text-primary: #2a2825 (Warm dark, not pure black)
--color-text-secondary: #6b6965 (Warm grey)
--color-text-muted: #9a9894 (Lighter grey)

--color-accent-blue: #4a7ba7 (Darker athletic blue for contrast)
--color-accent-blue-light: #6a9bc7 (Medium blue)
--color-accent-cream: #d4d0c9 (Cream for borders, backgrounds)
--color-accent-warm: #b89b6f (Wood tone, darker for contrast)
--color-accent-track: #e0dcd4 (Subtle track lines)

--color-success: #6b9b6b (Sage green)
--color-warning: #b89b4f (Amber)
--color-error: #a86b6b (Terracotta)
```

---

## Typography System

**Font Sources**: Google Fonts CDN

**Philosophy**: Geometric sans-serifs with human warmth. Wide tracking, bold weights for headlines, generous spacing.

### Font Selection

**Headlines (Display)**: `Space Grotesk` - from Google Fonts
- Geometric with personality
- Wide letter-spacing (tracking-wide)
- Bold weight (700) for impact
- Used for: Page titles, section headers, key numbers

**Body**: `DM Sans` - from Google Fonts
- Humanist geometric sans
- Clean legibility
- Used for: Body text, descriptions, labels

**Monospace (Numbers/Data)**: `DM Mono` - from Google Fonts
- Geometric monospace
- Tabular figures for aligned numbers
- Used for: Timers, reps, statistics, countdowns

**Font Loading Strategy**: All weights loaded via Google Fonts link in `app.css`

### Type Scale

```
--text-xs: 0.75rem (12px) - Captions, metadata
--text-sm: 0.875rem (14px) - Secondary text, labels
--text-base: 1rem (16px) - Body text
--text-lg: 1.125rem (18px) - Emphasized body
--text-xl: 1.25rem (20px) - Card titles
--text-2xl: 1.5rem (24px) - Section headers
--text-3xl: 2rem (32px) - Page titles
--text-4xl: 2.5rem (40px) - Hero titles (tracking-wide)
```

### Typography Patterns

**Page Title**:
```css
text-4xl font-bold tracking-wide text-text-primary
/* Gymnasium-inspired horizontal rule below */
border-b-2 border-accent-cream pb-4 mb-8
```

**Section Header**:
```css
text-2xl font-bold tracking-wide text-text-primary uppercase
/* Left accent bar */
border-l-4 border-accent-blue pl-4
```

**Card Title**:
```css
text-xl font-semibold text-text-primary
```

**Stats/Numbers**:
```css
font-mono text-2xl font-bold text-accent-blue
```

**Body**:
```css
text-base text-text-secondary leading-relaxed
```

---

## Visual Elements & Patterns

### 1. Gymnasium Track Lines
Thin horizontal rules inspired by running track lanes - subtle, rhythmic, organizing.

**Usage**:
- Section separators
- Card headers
- List item dividers
- Under headings

**Implementation**:
```css
.track-line {
  border-bottom: 1px solid var(--color-accent-track);
}
```

### 2. Geometric Corner Accents
Small squares or L-shapes at corners - referencing 80s geometric design without being overwhelming.

**Usage**:
- Card corners
- Button corners (subtle)
- Section corners

### 3. Warm Gradient Overlays
Subtle, warm gradients for depth - never harsh, always gentle.

**Dark Mode**:
```css
background: linear-gradient(135deg, var(--color-base) 0%, #222 100%);
```

**Light Mode**:
```css
background: linear-gradient(135deg, var(--color-base) 0%, #fff 100%);
```

### 4. Texture (Optional Enhancement)
Very subtle noise or grain overlay to avoid digital sterility.

### 5. Athletic Iconography
Custom geometric icons inspired by gym equipment:
- Barbell: Two squares connected by line
- Timer: Geometric stopwatch
- Track: Horizontal lines

---

## Component Design

### Buttons

**Primary (The "Action")**:
```css
/* Warm athletic blue, geometric, confident */
bg-accent-blue text-cream-white
px-6 py-3 rounded-none /* Sharp corners for 80s feel */
font-bold tracking-wide uppercase text-sm
border-2 border-accent-blue
hover:bg-accent-blue-light
active:scale-[0.98] /* Subtle press */
transition-all duration-150
```

**Secondary (The "Option")**:
```css
/* Outlined, warm grey */
bg-transparent text-text-primary
px-6 py-3 rounded-none
font-semibold tracking-wide
border-2 border-accent-cream
hover:bg-surface
```

**Ghost (The "Subtle")**:
```css
/* Minimal, text only with underline on hover */
text-text-secondary
hover:text-accent-blue
underline underline-offset-4 decoration-accent-cream
```

### Cards

**Movement Card**:
```css
bg-surface
border border-accent-track
/* Geometric corner accent */
relative
/* Before pseudo-element for corner square */
```

**Routine Card**:
```css
bg-surface
border-2 border-accent-track
/* Top border accent in blue */
border-t-4 border-t-accent-blue
p-6
hover:border-accent-blue
hover:-translate-y-0.5
transition-all duration-200
```

### Forms & Inputs

**Text Input**:
```css
bg-inset
text-text-primary
border-2 border-accent-track
rounded-none /* Sharp edges */
px-4 py-3
focus:border-accent-blue focus:outline-none
/* Bottom accent bar on focus */
```

### Navigation

**Page Header**:
- Fixed top, minimal height
- Logo: Geometric wordmark or monogram (ignored for now)
- Nav items: Uppercase, tracking-wide, subtle underlines
- Active: Accent blue with track line below
- Theme toggle button: Sun/moon icon in header for dark/light mode switching
- Mobile responsive: Hamburger menu on small screens

**Mobile Nav**:
- Full-screen overlay
- Large typography
- Track line separators between items
- Theme toggle accessible

### Responsive Design

**Mobile-First Approach**:
- Touch-friendly tap targets (minimum 44px)
- Stacked layouts on small screens
- Full-width cards on mobile
- Increased spacing on mobile for readability
- Theme toggle always accessible

**Desktop Enhancements**:
- Multi-column grids (2-3 columns)
- Hover effects on desktop only
- More generous whitespace

### Practice Player UI

**Timer Display**:
```css
font-mono text-6xl font-bold text-accent-blue
/* Geometric frame */
border-4 border-accent-track p-8
/* Corner accents */
```

**Progress Bar**:
```css
/* Thick, segmented progress like gym equipment */
height: 8px
background: accent-track
filled: accent-blue
/* Discrete segments, not continuous */
```

**Movement Block**:
```css
/* Card with left accent bar */
border-l-4 border-l-accent-warm
/* Track line separator between sets */
```

---

## Motion & Animation

**Philosophy**: Subtle, purposeful, respectful. Movement that guides without demanding attention.

### Page Transitions
```css
/* Gentle fade with slight upward movement */
opacity: 0 → 1
transform: translateY(8px) → translateY(0)
duration: 300ms
easing: cubic-bezier(0.25, 0.1, 0.25, 1)
```

### Micro-interactions

**Button Hover**:
```css
transition: all 150ms ease
/* Subtle lift */
transform: translateY(-1px)
/* Border color shift */
border-color: var(--color-accent-blue)
```

**Button Active/Press**:
```css
transform: scale(0.98)
duration: 100ms
```

**Card Hover**:
```css
transform: translateY(-2px)
border-color: var(--color-accent-blue)
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)
duration: 200ms
easing: cubic-bezier(0.25, 0.1, 0.25, 1)
```

**Focus States**:
```css
/* No glow, use border color shift */
border-color: var(--color-accent-blue)
outline: none
/* Optional: subtle inner accent */
box-shadow: inset 0 0 0 2px var(--color-accent-blue-light)
```

**Modal/Overlay**:
```css
/* Backdrop fade */
background: rgba(26, 26, 26, 0.8) /* Warm dark, not pure black */
opacity: 0 → 1
duration: 200ms

/* Content slide up */
transform: translateY(20px) scale(0.98) → translateY(0) scale(1)
duration: 300ms
easing: cubic-bezier(0.34, 1.56, 0.64, 1) /* Slight overshoot for organic feel */
```

### Countdown/Timers
```css
/* Number tick - subtle pulse */
transform: scale(1) → scale(1.02) → scale(1)
duration: 100ms
/* No bounce, just presence */
```

### Progress Animations
```css
/* Smooth but segmented progress */
transition: width 500ms cubic-bezier(0.25, 0.1, 0.25, 1)
```

---

## Dark/Light Mode Strategy

**Implementation**: CSS custom properties with class-based switching

**Switching Mechanism**:
```html
<html class="theme-dark"> or <html class="theme-light">
```

**Color Variables Update**:
- All colors defined as CSS custom properties in `:root`
- Two sets defined: default (dark) and `.theme-light` overrides
- Tailwind config references these variables

**Respect User Preference**:
- Default to dark mode
- Toggle in user settings
- Store preference in localStorage
- Sync with system preference on first visit (optional)

---

## Implementation Plan

### Phase 1: Foundation (CSS Variables & Typography)
1. Set up CSS custom properties in `app.css`
2. Add Google Fonts (Space Grotesk, DM Sans, DM Mono)
3. Update Tailwind config to use CSS variables
4. Create theme switching utility

### Phase 2: Global Elements
1. Update `+layout.svelte` with theme class binding
2. Style `PageHeader` component with theme toggle
3. Create global button/link styles
4. Update form input styles
5. Ensure mobile and desktop responsive design

### Phase 3: Components
1. Update `RoutineCard` and `MovementCard` (showing 6 items as before)
2. Redesign `PracticeHeader`, `PracticeFooter`
3. Style `MovementBlock`, `SetRow`
4. Redesign modals and overlays

### Phase 4: Pages
1. Update Home page layout (improve item display, logo ignored)
2. Style Routines and Movements pages
3. Complete Practice player redesign
4. Polish Login/Register pages

### Phase 5: Motion
1. Add page transitions
2. Implement micro-interactions
3. Add modal animations
4. Test reduced-motion preference

---

## Non-Corporate Principles Checklist

✅ **Warm neutrals** instead of cold greys  
✅ **Rounded corners are OUT** - use sharp, geometric edges  
✅ **Softer colors** - muted, not neon or pure  
✅ **Human imperfections** - slight texture, organic motion  
✅ **Nostalgic references** - gymnasium, 80s athletic gear  
✅ **Generous spacing** - breathing room, not dense  
✅ **Warm lighting** - as if late afternoon sun  
✅ **Approachable language** - not jargon-heavy  

---

## Visual Hierarchy & Elevation System

**Philosophy**: From "boxed" to "layered" - use elevation, gradients, and generous whitespace instead of rigid borders.

### Border Usage (Minimize)
Borders should be rare and purposeful:
- **Use for**: Inputs, critical CTAs, small accent details
- **Avoid for**: Content cards, sections, lists (use elevation instead)

### Elevation Levels

**Level 1 - Base**: No elevation, sits on background
- Page sections
- Content containers
- Track-line separators

**Level 2 - Elevated**: Subtle shadow, slight lift
- Hover states
- Secondary cards
- Active list items
- CSS: `shadow-elevated`

**Level 3 - Floating**: Pronounced shadow, clear separation
- Primary action cards (Create section)
- Modals, dropdowns
- Featured content
- CSS: `shadow-floating`

### Shadow System
Warm-tinted shadows (not harsh black):

**Dark Mode**:
```css
--shadow-elevated: 0 4px 20px rgba(91, 141, 184, 0.15), 
                    0 2px 8px rgba(0, 0, 0, 0.3);
--shadow-floating: 0 8px 32px rgba(91, 141, 184, 0.2), 
                   0 4px 12px rgba(0, 0, 0, 0.4);
```

**Light Mode**:
```css
--shadow-elevated: 0 4px 20px rgba(74, 123, 167, 0.12), 
                    0 2px 8px rgba(0, 0, 0, 0.08);
--shadow-floating: 0 8px 32px rgba(74, 123, 167, 0.15), 
                   0 4px 12px rgba(0, 0, 0, 0.1);
```

### Track Lines as Separators
Use thin horizontal lines for rhythm and organization:
- Section headers: Full-width track line below
- List items: Track line between items
- Card headers: Track line as top border accent

```css
.track-line {
  border-bottom: 1px solid var(--color-accent-track);
}

.track-line-top {
  border-top: 1px solid var(--color-accent-track);
}
```

---

## Texture & Grain

**Usage**: Hero section only (not global)

**Implementation**: CSS noise overlay using SVG filter or base64 noise pattern:
```css
.hero-grain {
  position: relative;
}

.hero-grain::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E");
  pointer-events: none;
  opacity: 0.4;
}
```

**Guidelines**:
- Opacity: 3-5% (very subtle)
- Only on hero gradient backgrounds
- Creates "film grain" 80s photo aesthetic
- Warm tint (not harsh black/white noise)

---

## Icon System

**Library**: Phosphor Icons (phosphor-svelte)
**Weight**: Duotone (gives 80s print aesthetic - two-tone, not flat)
**Size Scale**: 
- Small: 20px (inline, badges)
- Standard: 24px (buttons, navigation)
- Large: 32px (feature icons, empty states)

**Color**: Inherit from text color
- Default: `text-text-primary` or `text-text-secondary`
- Hover: `group-hover:text-accent-blue`
- Active: `text-accent-blue`

**Usage Patterns**:
```svelte
<!-- Navigation -->
<House weight="duotone" size={24} />
<Sun weight="duotone" size={24} />
<Moon weight="duotone" size={24} />

<!-- Actions -->
<Plus weight="duotone" size={24} />
<ArrowRight weight="duotone" size={20} />

<!-- Content -->
<Barbell weight="duotone" size={32} />
<Timer weight="duotone" size={32} />
```

---

## Updated Component Patterns

### Card Variants

**Elevated Card** (Primary Actions - Create Section):
```css
/* Floating, no border, prominent shadow */
bg-surface
shadow-floating
hover:shadow-elevated hover:-translate-y-0.5
transition-all duration-200
p-6
```

**Minimal Card** (Browse Content - Routines):
```css
/* Track line top, subtle shadow on hover */
bg-surface
border-t border-accent-track
hover:shadow-elevated hover:border-t-accent-blue
transition-all duration-200
p-5
```

**List Item** (Movement Library, Practices):
```css
/* No border, track separator, hover background */
flex items-center gap-4 py-4
border-b border-accent-track last:border-b-0
hover:bg-surface-elevated
transition-colors duration-150
```

### Section Headers

**With Track Line**:
```css
/* Full-width track line below header */
<div class="mb-8">
  <div class="flex items-center justify-between mb-4">
    <h2 class="font-display text-2xl font-bold tracking-wider uppercase text-text-primary">
      Section Title
    </h2>
    <a href="..." class="...">Browse all →</a>
  </div>
  <div class="w-full h-px bg-accent-track"></div>
</div>
```

### Hero Section

**Gradient + Grain**:
```css
/* Hero container */
relative overflow-hidden
bg-gradient-to-b from-surface to-base

/* Grain overlay */
<div class="absolute inset-0 opacity-[0.03] pointer-events-none" 
     style="background-image: url(...grain...)"></div>

/* Content */
relative z-10
```

---

## Updated Anti-Patterns

**New additions**:
❌ Border boxes around everything (use elevation instead)
❌ Heavy borders on content cards
❌ Flat solid backgrounds without depth
❌ Generic rounded icons (use Phosphor duotone)
❌ Harsh black shadows (use warm-tinted shadows)
❌ Global noise/texture (keep texture hero-only)

❌ Cold, sterile greys  
❌ Pure black backgrounds  
❌ Standard rounded buttons  
❌ Blue-purple gradients (overused)  
❌ Harsh drop shadows  
❌ Over-animated bouncy effects  
❌ Generic stock iconography  
❌ Dense, cramped layouts  
❌ Perfect geometric symmetry everywhere  
❌ Corporate-speak copy  

---

## Success Metrics

The design succeeds when:
- Users feel calm and focused (zen)
- The app feels distinctive and memorable
- No one says "looks like every other app"
- The 80s vibe is subtle, not costume-party
- Dark and light modes both feel cohesive
- Motion feels natural, not distracting
- The app feels human, not corporate
