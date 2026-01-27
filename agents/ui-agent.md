# UI Agent Guidelines

> An experienced UI/UX expert agent ensuring a dark, futuristic, and premium design inspired.

## Design Philosophy

### 🌙 Dark Theme Design
- **Dark-first approach**: Rich, deep backgrounds create immersive experiences
- **Layered surfaces**: Use subtle elevation through background lightness variations
- **Depth through darkness**: Darker elements recede, lighter elements come forward
- **Premium feel**: Dark themes convey sophistication and modernity

### 🟣 Purple Gradient Accents
- **Primary gradient**: Purple to violet creates signature visual identity
- **Gradient directions**: Use diagonal (135deg) or radial gradients for dynamism
- **Glow effects**: Colored glows on interactive elements add energy
- **Accent pops**: Strategic use of bright purple/cyan for CTAs and highlights

### ✨ Glassmorphism & Soft Shadows
- **Frosted glass cards**: Semi-transparent backgrounds with backdrop blur
- **Soft shadows**: Diffused shadows with large blur radius
- **Glowing borders**: Subtle gradient or glowing borders on cards
- **Layered depth**: Multiple translucent layers create visual hierarchy

### 🎯 Clean & Professional
- **Generous spacing**: Let elements breathe with ample whitespace
- **Clear typography**: High contrast text on dark backgrounds
- **Focused actions**: One primary CTA per section
- **Subtle animations**: Smooth transitions and micro-interactions

### 📱 Responsive Design
- **Mobile-first**: Design for mobile, enhance for larger screens
- **Breakpoints**:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px
- **Fluid typography**: Scale text appropriately across devices
- **Touch-friendly**: Minimum 44px touch targets on mobile

---

## Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#8B5CF6` | Violet - Primary actions, CTAs |
| `--color-primary-light` | `#A78BFA` | Light Violet - Hover states |
| `--color-secondary` | `#06B6D4` | Cyan - Secondary accents |
| `--color-accent` | `#EC4899` | Pink - Highlights, badges |
| `--color-success` | `#10B981` | Emerald - Success states |
| `--color-warning` | `#F59E0B` | Amber - Warnings |
| `--color-error` | `#EF4444` | Red - Error states |
| `--color-surface` | `#1E1E2E` | Dark surface - Card backgrounds |
| `--color-surface-elevated` | `#2A2A3E` | Elevated surface - Modals, dropdowns |
| `--color-background` | `#0F0F1A` | Deep dark - Page background |
| `--color-background-gradient` | `linear-gradient(135deg, #0F0F1A 0%, #1A1A2E 50%, #16162A 100%)` | Background gradient |
| `--color-text` | `#F8FAFC` | White - Primary text |
| `--color-text-muted` | `#94A3B8` | Gray - Secondary text |
| `--color-border` | `rgba(139, 92, 246, 0.2)` | Subtle purple border |

---

## Gradient Definitions

```css
/* Primary gradient for buttons and CTAs */
--gradient-primary: linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #8B5CF6 100%);

/* Accent gradient for special elements */
--gradient-accent: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%);

/* Subtle background gradient */
--gradient-surface: linear-gradient(180deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%);

/* Glow effect */
--glow-primary: 0 0 20px rgba(139, 92, 246, 0.4);
--glow-accent: 0 0 20px rgba(236, 72, 153, 0.4);
```

---

## Component Patterns

### Buttons
```css
/* Primary Button - Gradient with glow */
.btn-primary {
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  box-shadow: var(--glow-primary);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.6);
}

/* Secondary Button - Ghost style */
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: var(--color-primary);
}
```

### Cards - Glassmorphism
```css
.card {
  background: rgba(30, 30, 46, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.card-elevated {
  background: linear-gradient(135deg, rgba(42, 42, 62, 0.9) 0%, rgba(30, 30, 46, 0.9) 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
  box-shadow: 0 0 40px rgba(139, 92, 246, 0.15);
}
```

### Input Fields
```css
.input {
  background: rgba(15, 15, 26, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  color: var(--color-text);
  padding: 12px 16px;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}

.input::placeholder {
  color: var(--color-text-muted);
}
```

### Badges
```css
.badge {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 9999px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-primary-light);
}
```

---

## Layout Rules

### Spacing Scale
- `4px` - Tight spacing (inline elements)
- `8px` - Compact (between related items)
- `16px` - Default (between components)
- `24px` - Comfortable (section padding)
- `32px` - Generous (major sections)
- `48px` - Spacious (page sections)
- `64px` - Extra spacious (hero sections)

### Grid System
- Mobile: Single column, full width with 16px padding
- Tablet: 2 columns with 24px gap
- Desktop: Up to 3-4 columns with 32px gap
- Max content width: 1280px centered

### Navigation
- Dark, semi-transparent navbar with backdrop blur
- Logo on left, navigation center or right
- Subtle bottom border with gradient
- Sticky header with reduced height on scroll

---

## Visual Effects

### Hover States
- Subtle scale: `transform: scale(1.02)`
- Lift effect: `transform: translateY(-2px)`
- Glow intensification on interactive elements
- Border color brightening

### Animations
- Use `ease` or `ease-out` timing functions
- Duration: 150-300ms for micro-interactions
- Subtle fade-ins for content loading
- Smooth color transitions

### Background Treatments
- Subtle noise texture overlay for depth
- Gradient mesh backgrounds for hero sections
- Animated gradient orbs (optional, subtle)

---

## Accessibility

- Minimum contrast ratio: 4.5:1 for text (critical on dark backgrounds)
- Focus states: Visible ring with primary color glow
- Touch targets: Minimum 44x44px
- Reduced motion: Respect `prefers-reduced-motion`
- Ensure text remains readable over gradient backgrounds

---

## Do's and Don'ts

### ✅ Do
- Use dark, layered backgrounds
- Apply purple/violet gradients for accents
- Create depth with glassmorphism and soft shadows
- Add subtle glow effects on interactive elements
- Maintain high contrast for text readability
- Use smooth, subtle animations

### ❌ Don't
- Use bright white backgrounds
- Apply hard, offset shadows
- Overuse gradients (keep them purposeful)
- Make glow effects too intense
- Sacrifice readability for aesthetics
- Use jarring or fast animations
