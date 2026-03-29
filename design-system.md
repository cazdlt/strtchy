# Strtchy Design System

## Design Philosophy: "Zen Athletic 80s"

**Core Concept**: A warm, human take on 80s athletic aesthetics - the precision of retro athletic campaigns meeting the honest utility of old school gymnasiums. Think: geometric without coldness, structured without stiffness, retro without pastiche.

**Key Principles**:

- **Human Precision**: Geometric shapes with organic warmth (warm neutrals, soft shadows)
- **Quiet Confidence**: Bold structures with approachable details
- **Nostalgic Warmth**: 80s nostalgia filtered through modern minimalism
- **Anti-Corporate**: No sterile greys, no cold blues, no rigid uniformity

**Mood**: Late afternoon light in an empty gymnasium, track shoes on hardwood, chalk dust, warm vinyl, the satisfying clunk of metal weights.

---

## Color Palette

### Dark Mode: "Evening Practice"

The vibe: Post-workout, lights low, that golden-tinged blue of dusk through gym windows.

**CSS Variables**:

```css
--color-base: #151515 (Near black, warm undertone)
--color-surface: #1f1f1f (Card backgrounds)
--color-surface-elevated: #2a2a2a (Hover states, active items)
--color-surface-warm: #252220 (Warm surface variant)
--color-inset: #0f0f0f (Input backgrounds, recessed areas)
--color-inset-hover: #1a1a1a (Input hover states)

--color-text-primary: #faf8f5 (Warm cream white)
--color-text-secondary: #d4d0c7 (Muted warm grey)
--color-text-muted: #a09b92 (Subtle grey for hints)

--color-accent-primary: #5b8db8 (Retro athletic blue - primary CTA)
--color-accent-primary-light: #7ba3c4 (Highlight blue)
--color-accent-secondary: #8ab4d9 (Lighter blue accent)
--color-accent-warm: #e07a5f (Warm coral/orange - secondary accent)
--color-accent-cream: #e8e4dd (Warm cream accent)
--color-accent-track: #3d3a36 (Track line warm grey)

--color-accent-orange: #e07a5f (Warm orange - alternate name)
--color-accent-orange-light: #f4a688 (Light warm orange)

--color-success: #7aa87a (Muted sage green)
--color-success-light: #9bc99b (Light sage)
--color-warning: #c9a35a (Warm amber)
--color-error: #b87a7a (Muted terracotta red)
```

**Shadows** (Warm-tinted, not harsh black):

```css
--shadow-elevated: 0 4px 24px rgba(224, 122, 95, 0.12), 0 2px 8px rgba(0, 0, 0, 0.4);
--shadow-floating: 0 8px 40px rgba(224, 122, 95, 0.15), 0 4px 16px rgba(0, 0, 0, 0.5);
--shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.3);
```

### Light Mode: "Morning Practice"

The vibe: Early morning light, fresh start, the calm before the day begins.

**CSS Variables**:

```css
--color-base: #f5f1ea (Warm cream, not stark white)
--color-surface: #ffffff (Pure white for cards)
--color-surface-elevated: #faf8f5 (Hover states)
--color-surface-warm: #f0ebe3 (Warm surface variant)
--color-inset: #e8e3db (Input backgrounds)
--color-inset-hover: #e0dad1 (Input hover states)

--color-text-primary: #1a1814 (Warm dark, not pure black)
--color-text-secondary: #4a4640 (Warm grey)
--color-text-muted: #7a756b (Subtle grey)

--color-accent-primary: #2d5a85 (Darker athletic blue for contrast)
--color-accent-primary-light: #4a7ba7 (Medium blue)
--color-accent-secondary: #6a9bc7 (Lighter blue)
--color-accent-warm: #c55a40 (Deeper coral)
--color-accent-cream: #d4cfc4 (Cream for borders)
--color-accent-track: #e0d9d0 (Warm track lines)

--color-accent-orange: #c55a40 (Deeper orange)
--color-accent-orange-light: #e07a5f (Medium orange)

--color-success: #5a9a5a (Sage green)
--color-success-light: #7bbb7b (Light sage)
--color-warning: #b8924a (Amber)
--color-error: #a85a5a (Terracotta)
```

**Shadows**:

```css
--shadow-elevated: 0 4px 24px rgba(197, 90, 64, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
--shadow-floating: 0 8px 40px rgba(197, 90, 64, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08);
--shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.04);
```

**Usage**:

- Base: Main backgrounds
- Surface: Cards, sections, containers
- Text-primary: Headlines, primary content
- Accent-primary (blue): CTAs, active states, links, primary actions
- Accent-warm (coral): Secondary accents, warmth, highlights
- Accent-track: Gymnasium-inspired horizontal rules, separators
- Shadows: Warm-tinted with coral/orange undertones

---

## Typography System

**Font Sources**: Google Fonts CDN

**Philosophy**: Bold display typography for impact, clean body text for readability. Wide tracking, confident weights.

### Font Selection

**Headlines (Display)**: `Bebas Neue` - from Google Fonts

- Condensed, bold, athletic display font
- Natural wide letter-spacing
- Used for: Page titles, section headers, key numbers, buttons
- Weight: 400 (single weight font)

**Body/Title**: `Plus Jakarta Sans` - from Google Fonts

- Modern geometric sans with warmth
- Clean legibility at all sizes
- Used for: Body text, descriptions, card titles, labels
- Weights: 400 (regular), 700 (bold)

**Monospace (Numbers/Data)**: `DM Mono` - from Google Fonts

- Geometric monospace
- Tabular figures for aligned numbers
- Used for: Timers, reps, statistics, countdowns, badges

**Font Loading Strategy**: All fonts loaded via Google Fonts link in `app.html`

### Type Scale

```
--text-xs: 0.75rem (12px) - Captions, metadata
--text-sm: 0.875rem (14px) - Secondary text, labels
--text-base: 1rem (16px) - Body text
--text-lg: 1.125rem (18px) - Emphasized body
--text-xl: 1.25rem (20px) - Card titles
--text-2xl: 1.5rem (24px) - Section headers
--text-3xl: 2rem (32px) - Page titles
--text-4xl: 2.5rem (40px) - Hero titles (mobile: text-5xl, desktop: text-6xl)
```

### Typography Patterns

**Page Title/Hero**:

```css
font-display text-5xl sm:text-6xl text-text-primary tracking-wide leading-none
```

**Section Header**:

```css
font-display text-3xl text-text-primary tracking-wider
/* With track line below */
border-b border-accent-track pb-4 mb-6
```

**Card Title**:

```css
font-title text-lg text-text-primary
/* Hover state */
group-hover:text-accent-primary transition-colors
```

**Stats/Numbers**:

```css
font-display text-4xl text-accent-primary
/* Or for inline stats */
font-mono text-sm text-accent-primary
```

**Body**:

```css
font-body text-base text-text-secondary
```

**Button Text**:

```css
font-display text-lg tracking-widest uppercase
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
/* Full track line */
border-b-2 border-accent-track

/* Thin track line */
border-b border-accent-track

/* Top track line */
border-t border-accent-track
```

### 2. Sharp Corners (Geometric)

**NO rounded corners** - 80s geometric aesthetic demands sharp edges.

```css
/* Buttons, cards, inputs - all sharp */
rounded-none

/* Or explicit */
border-radius: 0;
```

### 3. Top Border Accents

Cards feature a thick top border accent in the primary blue:

```css
border-t-4 border-t-accent-primary
```

### 4. Elevation & Shadows

Warm-tinted shadows create depth without harshness:

**Elevated** (cards, hover states):

```css
style="box-shadow: var(--shadow-elevated);"
```

**Floating** (modals, primary actions):

```css
style="box-shadow: var(--shadow-floating);"
```

### 5. Geometric Corner Accents

Small accent squares at corners:

```css
.corner-accent::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 8px;
  height: 8px;
  background: var(--color-accent-primary);
}
```

### 6. Blue Glow on Hover

Subtle inner glow for interactive cards:

```css
<div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
     style="box-shadow: inset 0 0 30px rgba(91, 141, 184, 0.1);"></div>
```

---

## Component Design

### Buttons

**Primary (CTA)**:

```css
inline-flex items-center gap-2
px-8 py-4
bg-accent-primary text-white
hover:bg-accent-primary-light
transition-all duration-150
font-display text-lg tracking-widest uppercase
```

**Secondary (Outline)**:

```css
inline-flex items-center gap-2
px-8 py-4
bg-surface text-text-primary
hover:text-accent-primary
transition-colors
border-2 border-accent-track hover:border-accent-primary
```

**Ghost/Link**:

```css
text-text-muted hover:text-accent-primary
transition-colors
text-sm font-body uppercase tracking-wider
```

**Icon Button (Small)**:

```css
w-8 h-8 flex items-center justify-center
bg-accent-primary/10 group-hover:bg-accent-primary
transition-colors
```

### Cards

**Routine Card** (Primary focus):

```css
group relative bg-surface p-5
hover:-translate-y-0.5 transition-all duration-200
border-t-4 border-t-accent-primary
style="box-shadow: var(--shadow-elevated);"
```

**With blue glow overlay**:

```css
<!-- Blue glow on hover -->
<div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
     style="box-shadow: inset 0 0 30px rgba(91, 141, 184, 0.1);"></div>
```

**List Item** (Recent activity, practices):

```css
group flex items-center gap-4 p-4
bg-surface hover:bg-surface-elevated
transition-colors duration-150
border-b border-accent-track last:border-b-0
style="box-shadow: var(--shadow-elevated);" <!-- on first item -->
```

**Quick Action Card**:

```css
group inline-flex items-center gap-3 px-5 py-3
bg-surface hover:bg-surface-elevated
transition-colors
style="box-shadow: var(--shadow-elevated);"
```

**Compact Tag** (Movement library):

```css
group inline-flex items-center gap-2 px-3 py-2
bg-surface hover:bg-surface-elevated
transition-colors text-sm
border border-accent-track hover:border-accent-primary
```

### Forms & Inputs

**Text Input**:

```css
bg-inset text-text-primary
border-2 border-accent-track
rounded-none /* Sharp edges */
px-4 py-3
focus:border-accent-primary focus:outline-none
```

### Icons

**Library**: Phosphor Icons (phosphor-svelte)

**Weight**: Duotone (gives 80s print aesthetic)

**Size Scale**:

- Small: 14-16px (inline, badges)
- Standard: 20-24px (buttons, navigation)
- Large: 32px (feature icons)

**Color Usage**:

```svelte
<!-- Default accent -->
<Barbell weight="duotone" size={16} class="text-accent-primary" />

<!-- Hover state -->
<ArrowRight weight="bold" size={20} class="text-text-muted group-hover:text-accent-primary transition-colors" />

<!-- Fill for emphasis -->
<Play weight="fill" size={14} class="text-accent-primary" />
```

### Navigation

**Page Header**:

- Fixed top, minimal
- Logo: Geometric wordmark (if present)
- Nav items: Uppercase, tracking-wide
- Theme toggle: Sun/moon icon

**Mobile Nav**:

- Hamburger menu on small screens
- Full-screen overlay

---

## Page Patterns

### Hero Section

**Stats Bar** (for logged-in users):

```css
<div class="flex items-center gap-8 py-4">
  <div class="flex items-baseline gap-2">
    <span class="font-display text-4xl text-accent-primary">{count}</span>
    <span class="text-text-muted text-sm uppercase tracking-wider">label</span>
  </div>
  <div class="w-px h-8 bg-accent-track"></div>
  <!-- Repeat -->
</div>
```

**Greeting Block**:

```css
<div class="space-y-2">
  <div class="flex items-baseline gap-4">
    <span class="text-text-muted text-sm uppercase tracking-widest font-body">{TIME_OF_DAY}</span>
    <div class="flex-1 h-px bg-accent-track"></div>
  </div>
  <h1 class="font-display text-5xl sm:text-6xl text-text-primary tracking-wide leading-none">
    HEADLINE
  </h1>
</div>
```

### Section Headers

**With "Browse all" link**:

```css
<div class="flex items-center justify-between mb-6 pb-4 border-b border-accent-track">
  <h2 class="font-display text-3xl text-text-primary tracking-wider">
    SECTION TITLE
  </h2>
  <a href="..." class="text-text-muted hover:text-accent-primary transition-colors text-sm font-body uppercase tracking-wider">
    See all →
  </a>
</div>
```

### Numbered List

**With index badges**:

```css
<div class="w-10 h-10 bg-surface-elevated flex items-center justify-center shrink-0">
  <span class="font-mono text-sm text-accent-primary">{String(index + 1).padStart(2, '0')}</span>
</div>
```

### Status Indicators

**In progress pulse**:

```css
<span class="shrink-0 text-xs text-accent-secondary flex items-center gap-1">
  <span class="w-1.5 h-1.5 bg-accent-secondary animate-pulse"></span>
  In progress
</span>
```

---

## Motion & Animation

**Philosophy**: Subtle, purposeful, respectful. Movement that guides without demanding attention.

### Micro-interactions

**Card Hover**:

```css
hover:-translate-y-0.5 transition-all duration-200
```

**Color Transitions**:

```css
transition-colors duration-150
transition-colors duration-200
```

**Button/Link Hover**:

```css
transition-all duration-150
```

**Focus States**:

```css
:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}
```

### Theme Switching

**Smooth transitions for theme switching**:

```css
html, body, div, span, p, a, button, input, textarea {
  transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease;
}
```

---

## Dark/Light Mode Strategy

**Implementation**: CSS custom properties with class-based switching

**Switching Mechanism**:

```html
<html class="theme-light">  <!-- Light mode -->
<html>  <!-- Dark mode (default, no class needed) -->
```

**Color Variables**: All colors defined as CSS custom properties in `:root`, with `.theme-light` overrides in `app.css`.

**Respect User Preference**:

- Default to dark mode
- Toggle in header
- Store preference in localStorage

---

## Non-Corporate Principles Checklist

✅ **Warm neutrals** instead of cold greys  
✅ **Sharp corners** - NO rounded corners, geometric aesthetic  
✅ **Warm-tinted shadows** - coral/orange undertones, not harsh black  
✅ **Athletic display typography** - Bebas Neue for impact  
✅ **Track lines** - gymnasium-inspired separators  
✅ **Top border accents** - blue accent on cards  
✅ **Generous spacing** - breathing room, not dense  
✅ **Direct language** - uppercase, tracking-wide, no corporate jargon  
✅ **Geometric minimalism** - clean lines, no ornamentation

---

## Anti-Patterns

❌ Cold, sterile greys  
❌ Pure black backgrounds  
❌ Rounded corners (any radius > 0)  
❌ Harsh black shadows  
❌ Over-animated bouncy effects  
❌ Dense, cramped layouts  
❌ Corporate-speak copy  
❌ Multiple accent colors competing  
❌ Gradient backgrounds (use solid + shadows)

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
