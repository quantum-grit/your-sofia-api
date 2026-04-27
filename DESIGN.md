# Design System — Твоята София

## Product Context

- **What this is:** A bilingual civic engagement mobile app (iOS + Android) and Payload CMS admin UI for Sofia residents and municipality staff
- **Who it's for:** Sofia residents reporting civic issues, accessing city news, air quality, and transport data; municipality staff managing content and signals via admin
- **Space/industry:** Smart city / civic tech / e-government (Bulgaria)
- **Project type:** Mobile app (React Native/Expo) + Admin/CMS (Next.js/Payload)

---

## Aesthetic Direction

- **Direction:** Civic Editorial — type-forward, information-rich. Treats city data the way a great newspaper treats news. Not corporate blue walls.
- **Decoration level:** Intentional — clean white cards on off-white background, subtle borders. No decorative blobs or gradients.
- **Mood:** Authoritative but approachable. The app should feel like it was made with care for the city, not stamped out from a template. Gold accent signals civic identity; blue signals trust.
- **Reference:** Sofia's own heraldic palette — blue shield + gold — informs the two-color brand system.

---

## Typography

- **Display/Hero:** Sofia Sans 800 — Cyrillic-native geometric humanist, named after the city. Confident at large sizes, strong Cyrillic letterforms.
- **Body:** Sofia Sans 400 — same family, comfortable at 14–16px, designed for extended reading in both Bulgarian and English.
- **UI/Labels:** Sofia Sans 600 — used for button labels, nav items, badge text, form labels.
- **Data/Tables:** JetBrains Mono 500–600 — tabular-nums for AQI values, container counts, timestamps, metrics, and dates in tables. Creates clear information hierarchy on data-heavy screens.
- **Code:** JetBrains Mono 400

**Loading — Mobile (Expo):**

```
@expo-google-fonts/sofia-sans
@expo-google-fonts/jetbrains-mono
```

**Loading — Admin/Web:**

```html
<link
  href="https://fonts.googleapis.com/css2?family=Sofia+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
  rel="stylesheet"
/>
```

**Type Scale:**

| Level   | Font           | Size    | Weight | Usage                             |
| ------- | -------------- | ------- | ------ | --------------------------------- |
| H1      | Sofia Sans     | 32px    | 800    | Screen titles, hero headings      |
| H2      | Sofia Sans     | 24px    | 700    | Section headings                  |
| H3      | Sofia Sans     | 20px    | 700    | Card titles, modal headings       |
| Body    | Sofia Sans     | 16px    | 400    | Article body, descriptions        |
| Body SM | Sofia Sans     | 14px    | 400    | Secondary content, card text      |
| Label   | Sofia Sans     | 13px    | 600    | Form labels, nav items, buttons   |
| Caption | Sofia Sans     | 12px    | 400    | Metadata, timestamps, helper text |
| Data LG | JetBrains Mono | 28–40px | 600    | AQI numbers, key metrics          |
| Data SM | JetBrains Mono | 12–14px | 500    | Dates in tables, codes, IDs       |

---

## Color

- **Approach:** Balanced — primary + gold accent, semantic colors for status. Color is meaningful, not decorative.

### Core Palette

| Token               | Hex       | Usage                                                           |
| ------------------- | --------- | --------------------------------------------------------------- |
| `primary`           | `#2F54C5` | Buttons, tab bar active, links, focus rings                     |
| `primary-dark`      | `#082E8E` | Hover/pressed states, headings on light                         |
| `primary-light`     | `#5078F0` | Interactive lighter state, dark mode primary                    |
| `primary-tint`      | `#EEF2FF` | Badge backgrounds, nav active bg, input focus shadow            |
| `accent-gold`       | `#E0B340` | Category badges, left-border accents, official/featured markers |
| `accent-gold-light` | `#FEF3C0` | Gold badge backgrounds, highlighted card tints                  |

### Neutrals

| Token            | Hex       | Usage                                              |
| ---------------- | --------- | -------------------------------------------------- |
| `bg`             | `#F8FAFC` | App/page background                                |
| `surface`        | `#FFFFFF` | Cards, modals, inputs, tab bar                     |
| `surface-2`      | `#F1F5F9` | Hover states, secondary surfaces, skeleton loading |
| `border`         | `#E2E8F0` | Card borders, dividers, input borders              |
| `text-primary`   | `#1E293B` | Headings, body text                                |
| `text-secondary` | `#475569` | Secondary descriptions, metadata                   |
| `text-muted`     | `#94A3B8` | Placeholder text, captions, timestamps             |

### Semantic Colors

| Token           | Hex       | Usage                                             |
| --------------- | --------- | ------------------------------------------------- |
| `success`       | `#059669` | Resolved signals, good AQI, confirmations         |
| `success-light` | `#D1FAE5` | Success badge backgrounds                         |
| `warning`       | `#D97706` | In-progress signals, moderate AQI, partial alerts |
| `warning-light` | `#FEF3C7` | Warning badge backgrounds                         |
| `error`         | `#DC2626` | Open/urgent signals, poor AQI, error states       |
| `error-light`   | `#FEE2E2` | Error badge backgrounds                           |
| `info`          | `#0284C7` | Informational alerts, system notices              |
| `info-light`    | `#E0F2FE` | Info badge backgrounds                            |

### Dark Mode

Redesign surfaces: `bg → #0F172A`, `surface → #1E293B`, `surface-2 → #263348`. Reduce gold saturation ~10%. Primary shifts to `#5078F0` for legibility on dark backgrounds.

---

## Spacing

- **Base unit:** 8px
- **Density:** Comfortable — not cramped, not airy

| Token | Value | Usage                                 |
| ----- | ----- | ------------------------------------- |
| `2xs` | 4px   | Icon padding, tight gaps              |
| `xs`  | 8px   | Item gaps within components           |
| `sm`  | 12px  | Card internal padding (compact)       |
| `md`  | 16px  | Card padding, page horizontal margins |
| `lg`  | 24px  | Section gaps, card vertical padding   |
| `xl`  | 32px  | Between sections                      |
| `2xl` | 48px  | Major section breaks                  |
| `3xl` | 64px  | Hero/header padding                   |

**Mobile page margins:** 16px horizontal, 16px top, 80px bottom (tab bar clearance).

---

## Layout

- **Mobile approach:** Grid-disciplined — 16px page margins, 8px component gap, 12px card gap
- **Admin approach:** Sidebar nav (200px fixed) + fluid content area; tighter density than mobile
- **Max content width (admin):** 1100px
- **Grid:** Mobile single-column; Admin 4-column stat grid, fluid tables

### Border Radius

| Token         | Value   | Usage                                   |
| ------------- | ------- | --------------------------------------- |
| `radius-sm`   | 4–6px   | Tags, chips, small badges               |
| `radius-md`   | 8–10px  | Buttons, inputs, stat cards, list items |
| `radius-lg`   | 12–14px | Content cards, phone frame              |
| `radius-xl`   | 20px    | Bottom sheets, modals                   |
| `radius-full` | 9999px  | Pills, avatar circles, FAB button       |

Not everything uses the same radius — small elements get small radius, large containers get large radius.

---

## Motion

- **Approach:** Minimal-functional — only transitions that aid comprehension
- **Easing:** enter `ease-out` / exit `ease-in` / move `ease-in-out`
- **Duration:**
  - `micro` 50–100ms — icon state changes, badge color swaps
  - `short` 150–250ms — button hover, input focus
  - `medium` 250–400ms — screen transitions, modal open/close
  - `long` 400–700ms — bottom sheet, map zoom

No decorative scroll animations. No entrance choreography on list items.

---

## Component Conventions

### Mobile (React Native StyleSheet)

- Cards: `backgroundColor: '#FFFFFF'`, `borderRadius: 12`, `borderWidth: 1`, `borderColor: '#E2E8F0'`
- Tab bar active: `#2F54C5` — update `tabBarActiveTintColor` in `app/(tabs)/_layout.tsx`
- Tab bar background: `#FFFFFF` with `borderTopColor: '#E2E8F0'`
- AQI/metric values: `fontFamily: 'JetBrainsMono_600SemiBold'`, `tabularNums: true`
- Buttons: `borderRadius: 8`, `paddingHorizontal: 20`, `paddingVertical: 10`
- Gold category badges: `backgroundColor: '#FEF3C0'`, `color: '#92650A'` (dark brown for contrast on light) or white text on `#E0B340` background for solid badges

### Admin (Payload CMS / Next.js)

- Same token values via CSS custom properties
- Sidebar nav width: 200px
- Table density: compact — 10–12px cell padding
- Stat cards: same `radius-md` as mobile

---

## Decisions Log

| Date       | Decision                                | Rationale                                                                                                                                                   |
| ---------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-27 | Sofia Sans as primary typeface          | Cyrillic-native, named after the city, one font family covers all weights and both languages. Signals care and intentionality.                              |
| 2026-04-27 | JetBrains Mono for data/numbers         | Tabular alignment for AQI, counts, timestamps. Clear visual hierarchy on data-heavy screens.                                                                |
| 2026-04-27 | Primary blue `#2F54C5`                  | Brighter and more saturated than the previous `#1E40AF` — stronger presence on white, maintains trust signal.                                               |
| 2026-04-27 | Primary dark `#082E8E`, light `#5078F0` | Coherent three-stop ramp for pressed/hover states and dark-mode primary.                                                                                    |
| 2026-04-27 | Gold accent `#E0B340`                   | Sofia's city shield is blue + gold. Using the heraldic palette makes the identity true, not decorative. Amber brightness ensures visibility at badge scale. |
| 2026-04-27 | 8px spacing grid, comfortable density   | Matches Expo/RN default mental model, works for both compact admin and spacious mobile.                                                                     |
| 2026-04-27 | Covers mobile app + admin/CMS           | Single design system for both surfaces — same tokens, different density.                                                                                    |
