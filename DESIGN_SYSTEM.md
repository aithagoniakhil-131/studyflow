# Design System & UI Style Guide — StudyFlow

StudyFlow matches the premium, futuristic, dark, slightly anime-inspired dashboard aesthetic from the Google Stitch design files.

---

## Design Tokens (Tailwind CSS v4 Configuration)

All tokens are defined in the `@theme` directive in `src/index.css`:

### Color Palette
- **Background Base** (`bg-base`): `#0F0F12` — Root background color
- **Background Sidebar** (`bg-sidebar`): `#13131A` — Nav layout container background
- **Background Card** (`bg-card`): `#171721` — Solid container panels
- **Border Card** (`border-card`): `#222230` — Border lines separating widgets
- **Brand Primary Purple** (`brand-purple`): `#9D7BF5` — Active selections, metrics gauges, action highlights
- **Text Primary** (`text-primary`): `#FFFFFF` — High-contrast labels
- **Text Secondary** (`text-secondary`): `#E4E4E7` — Readable paragraphs
- **Text Muted** (`text-muted`): `#8C8C9E` — Low-emphasis tags

---

## Typography

- **Headings & Dashboard Stats** (`font-display`): **Outfit**
  - Styled with letter-spacing reductions (`tracking-tight` / `-1.68px` on hero blocks) for a cinematic, high-density dashboard appearance.
- **Body, Inputs & Sidebar Nav** (`font-sans`): **Inter**
  - Styled with standard sizing, optimized readability, and anti-aliased font smoothing.

---

## Custom UI Modules

### 1. Glassmorphism Panels
- Glass panels combine low opacity card structures with standard blur triggers:
  ```css
  .glass-panel {
    background: rgba(23, 23, 33, 0.7);
    backdrop-filter: blur(12px);
    border: 1px solid var(--color-border-card);
  }
  ```

### 2. Task Priority Badges
- **High**: Red Text, dark red background with subtle border.
  - Styles: `text-[#EF4444] bg-[#451A1A] border-[#EF444430]`
- **Medium**: Cyan Text, dark cyan background with subtle border.
  - Styles: `text-[#06B6D4] bg-[#0E2B35] border-[#06B6D430]`
- **Low**: Muted gray Text, dark slate background.
  - Styles: `text-[#8C8C9E] bg-[#222230] border-[#8C8C9E30]`

### 3. Workload UI Indicators
Tasks and planners sum and label workload minutes:
- **Light**: $0$–$119$ minutes. Indicator color: `text-emerald-400`
- **Moderate**: $120$–$300$ minutes. Indicator color: `text-blue-400`
- **Heavy**: $> 300$ minutes. Indicator color: `text-rose-400`
