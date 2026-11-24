---
name: Amplitude Core
colors:
  surface: '#f7f9fe'
  surface-dim: '#d7dade'
  surface-bright: '#f7f9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f8'
  surface-container: '#ebeef2'
  surface-container-high: '#e5e8ec'
  surface-container-highest: '#e0e3e7'
  on-surface: '#181c1f'
  on-surface-variant: '#434656'
  inverse-surface: '#2d3134'
  inverse-on-surface: '#eef1f5'
  outline: '#737687'
  outline-variant: '#c3c5d9'
  surface-tint: '#004ee7'
  primary: '#003ebc'
  on-primary: '#ffffff'
  primary-container: '#0052f2'
  on-primary-container: '#d9deff'
  inverse-primary: '#b6c4ff'
  secondary: '#495c93'
  on-secondary: '#ffffff'
  secondary-container: '#acbffd'
  on-secondary-container: '#394d83'
  tertiary: '#203bbb'
  on-tertiary: '#ffffff'
  tertiary-container: '#3e56d4'
  on-tertiary-container: '#dbdeff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#001550'
  on-primary-fixed-variant: '#003ab2'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b3c5ff'
  on-secondary-fixed: '#001849'
  on-secondary-fixed-variant: '#31447a'
  tertiary-fixed: '#dee0ff'
  tertiary-fixed-dim: '#bac3ff'
  on-tertiary-fixed: '#00105b'
  on-tertiary-fixed-variant: '#1936b7'
  background: '#f7f9fe'
  on-background: '#181c1f'
  surface-variant: '#e0e3e7'
  blue-on-black: '#4083FF'
  violet: '#A373FF'
  pink: '#FF7D78'
  red: '#F23845'
typography:
  title-xxl:
    fontFamily: Gellix
    fontSize: 64px
    fontWeight: '700'
    lineHeight: 70px
  title-xxl-mobile:
    fontFamily: Gellix
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 44px
  title-xl:
    fontFamily: Gellix
    fontSize: 56px
    fontWeight: '600'
    lineHeight: 62px
  title-xl-mobile:
    fontFamily: Gellix
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 40px
  title-l:
    fontFamily: Gellix
    fontSize: 44px
    fontWeight: '600'
    lineHeight: 48px
  title-l-mobile:
    fontFamily: Gellix
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 36px
  title-m:
    fontFamily: Gellix
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 40px
  title-m-mobile:
    fontFamily: Gellix
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
  title-s:
    fontFamily: Gellix
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 31px
  title-xs:
    fontFamily: Gellix
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 24px
  eyebrow-m:
    fontFamily: Gellix
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
  eyebrow-s:
    fontFamily: Gellix
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
  text-xl:
    fontFamily: Gellix
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 27px
  text-l:
    fontFamily: Gellix
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 24px
  text-m:
    fontFamily: Gellix
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 22px
  text-s:
    fontFamily: Gellix
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 19px
  text-xs:
    fontFamily: Gellix
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  text-xxs:
    fontFamily: Gellix
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 13px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

# Amplitude – Design System
Reference for developers, designers, and agents building on amplitude.com or with `@amplitude/core-ui`.
Sources: brand.amplitude.com · javascript-amplitude-storybook.vercel.app
---
## Colors
### Primary
Always lead with these three. Every layout starts here before reaching for secondaries.
| Name           | Hex       | Notes                                                        |
|----------------|-----------|--------------------------------------------------------------|
| Amplitude Blue | `#0052F2` | CTAs, links, interactive highlights. Use `#4083FF` on black. |
| Black          | `#000000` | Headings, primary text, dark backgrounds                     |
| White          | `#FFFFFF` | Page backgrounds, reversed text                              |
### Secondary
Use sparingly as intentional accents. Never lead a layout with these.
| Name      | Hex       |
|-----------|-----------|
| Dark Blue | `#001A4F` |
| Lilac     | `#6980FF` |
| Violet    | `#A373FF` |
| Pink      | `#FF7D78` |
| Red       | `#F23845` |
Pink and Red must be used minimally. Secondary colors must never be used in typography.
### Grays
| Name     | Hex       | Role                             |
|----------|-----------|----------------------------------|
| Gray 100 | `#13171A` | Darkest bg, near-black surfaces  |
| Gray 90  | `#242A2E` | Dark elevated surfaces           |
| Gray 80  | `#373D42` | Secondary text on dark           |
| Gray 70  | `#50565B` | Tertiary text                    |
| Gray 60  | `#697077` | Muted text                       |
| Gray 50  | `#868D95` | Placeholder, disabled text       |
| Gray 40  | `#9FA5AD` | Subtle borders                   |
| Gray 30  | `#B9BFC7` | Dividers                         |
| Gray 20  | `#D5D9E0` | Default borders, input strokes   |
| Gray 10  | `#F2F4F8` | Light surface bg, hover states   |
---
## Typography
**Font:** Gellix (custom geometric sans-serif). Always use `font-gellix` — never set font-family inline.
**Substitutions:** Poppins for Google environments · Helvetica as last resort only.
**Weights:** Regular (400) · Medium (500) · SemiBold (600) · Bold (700).
Bold is reserved for display headings only. Default to SemiBold for most titles.
### Type scale
| Style      | Weight   | Size | Line Height | Use                            |
|------------|----------|------|-------------|--------------------------------|
| Title XXL  | Bold     | 64px | 70px        | Hero / H1                      |
| Title XL   | SemiBold | 56px | 62px        | Section title / H2             |
| Title L    | SemiBold | 44px | 48px        | Sub-section / H3               |
| Title M    | SemiBold | 36px | 40px        | Card headline / H4             |
| Title S    | SemiBold | 28px | 31px        | Component heading / H5         |
| Title XS   | Medium   | 22px | 24px        | Small heading / H6             |
| Eyebrow M  | SemiBold | 14px | auto        | Section labels, eyebrows       |
| Eyebrow S  | SemiBold | 12px | auto        | Tags, small labels             |
| Text XL    | Regular  | 20px | 27px        | Large body / intro paragraphs  |
| Text L     | Regular  | 18px | 24px        | Default body / prose           |
| Text M     | Regular  | 16px | 22px        | Secondary body / UI copy       |
| Text S     | Medium   | 14px | 19px        | Captions, metadata, labels     |
| Text XS    | Medium   | 12px | 16px        | Fine print                     |
| Text XXS   | SemiBold | 10px | 13px        | Micro labels                   |
**Type color rules:**
- Default: black or white
- Hierarchy: Gray 60–80
- Links / CTAs / eyebrows: `#0052F2` (use `#4083FF` on black backgrounds)
- Never apply secondary palette colors to text
---
## Components (`@amplitude/core-ui`)
Full docs at javascript-amplitude-storybook.vercel.app. Always use library components before building custom ones.
### Button
Four variants, two sizes. Always `rounded-lg` (8px radius).
| Variant      | Background  | Text      | Border    | Use                      |
|--------------|-------------|-----------|-----------|--------------------------|
| primary      | `#0052F2`   | white     | `#0052F2` | Primary action           |
| secondary    | white       | `#1E2024` | `#DEDDE2` | Secondary action         |
| tertiary     | transparent | `#0052F2` | none      | Low-emphasis blue action |
| tertiary-alt | transparent | `#1E2024` | none      | Low-emphasis gray action |
Sizes: `medium` (32px height, 14px font) · `small` (24px height, 12px font)
Props: `isDanger` · `isLoading` · `iconOnly` · `disabled`
---
## Logo
- Full logo (logomark + logotype): default in most cases
- Logomark alone: when space is limited
- Colors: black or white only — Amplitude Blue in special cases only
- Min size: 20px height digital · ¼ inch print
- Alignment: left or center only
- Never skew, rotate, recolor, recreate with AI, or use as a pattern
---
## Voice & Content
**Mission:** We help companies build better digital products and experiences.
**Tagline:** Amplitude. Your unfair advantage.
**Three voice principles:**
- **Magnetic** — Hook with curiosity gaps. "What if you could…" "Imagine if…" "Let's…"
- **Provocative** — Challenge assumptions, take a stance. Short sentences, no filler, no hedging.
- **Empowering** — Focus on what *they* can do. Plain language, no jargon.
**Writing principles:** Be brief · Be clear · Be conversational · Be relevant · 8th-grade level
**Avoid:** game-changing, cutting-edge, powerful, robust, seamless, leverage, synergy, unlock, revolutionary
**Use instead:** use, build, decide, make the most of, improve, ship
**Product name rules:**
- Full name on first reference: "Amplitude Analytics", then "Analytics" after
- Capitalize parent products, lowercase features: "Amplitude Experiment" / "holdout group"
- Exception for unique names: "Amplitude AI" / "Ask Amplitude"
---
## Do's and Don'ts
- **Do** lead every layout with Black, White, and Amplitude Blue
- **Do** use `font-gellix` — Poppins in Google environments
- **Do** reserve Bold weight for display headings only
- **Do** use `#4083FF` for blue text on black backgrounds
- **Do** use `@amplitude/core-ui` components before building custom ones
- **Don't** apply secondary colors to typography
- **Don't** use Red in large quantities or lead with secondary colors
- **Don't** skew, rotate, or recreate the Amplitude logo
- **Don't** use: powerful, seamless, game-changing, leverage