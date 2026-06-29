---
name: impeccable
description: Use when the user wants to make a frontend interface more beautiful, animated, bold, polished, or delightful. Covers motion, micro-interactions, color, typography, personality, and visual quality. Not for backend-only or non-UI tasks.
version: 3.8.0
user-invocable: true
argument-hint: "[animate|delight|overdrive] [target]"
license: Apache 2.0
allowed-tools: []
---

Makes frontend interfaces beautiful, animated, and memorable. Real working code, committed design choices, exceptional craft.

## Setup

Before proceeding:

1. Read the relevant sub-command reference (`reference/<command>.md`) for the command invoked.
2. Familiarize yourself with the existing design system, components, and CSS in the project. Read at least one project file (CSS / tokens / theme / a representative component or page). Use what's already there; don't reinvent.
3. Read `reference/brand.md` for marketing/landing pages, or `reference/product.md` for app UI/dashboards (pick by first match: task cue, surface in focus).

## Design guidance

Produce ready-to-ship, production-grade code. Take no shortcuts. Don't stop until the result is beautiful, responsive, fast, precise, and on brand. Every element crafted should be battle-tested. Don't hold back.

### Color

- Verify contrast. Body text ≥4.5:1; large text ≥3:1. Muted gray body text on a tinted near-white is the single biggest reason AI designs feel hard to read.
- Gray text on a colored background looks washed out. Use a darker shade of the background's own hue.

### Typography

- Cap body line length at 65–75ch.
- Pair fonts on a contrast axis (serif + sans, geometric + humanist). Don't pair two similar sans-serifs.
- Hero heading ceiling: clamp() max ≤ 6rem. Letter-spacing floor: ≥ -0.04em.
- Use `text-wrap: balance` on h1–h3; `text-wrap: pretty` on prose.

### Layout

- Vary spacing for rhythm.
- Cards only when truly the best affordance. Nested cards are always wrong.
- Flexbox for 1D, Grid for 2D.

### Motion

- Motion should be intentional, not an afterthought — consider it as part of the build.
- Don't animate CSS layout properties unless truly needed.
- Ease out with exponential curves (ease-out-quart / quint / expo). No bounce, no elastic.
- Use libraries for advanced motion (motion, gsap, anime.js, lenis, etc.).
- Every animation needs a `@media (prefers-reduced-motion: reduce)` alternative.
- Staggering items within one list is legitimate. Avoid the uniform reflex (identical entrance on every section).
- Reveal animations must enhance an already-visible default. Don't gate content visibility on a class-triggered transition.
- Premium motion materials: blur, backdrop-filter, clip-path, mask, shadow/glow — use when they materially improve the effect.

### Absolute bans

- **Side-stripe borders.** `border-left` or `border-right` > 1px as a colored accent. Never intentional.
- **Gradient text.** `background-clip: text` + gradient. Use solid color instead.
- **Glassmorphism as default.** Rare and purposeful only.
- **Identical card grids.** Same-sized cards with icon + heading + text, repeated endlessly.
- **Tiny uppercase tracked eyebrow above every section.** One deliberate kicker system is voice; eyebrows on every section is AI grammar.
- **Numbered section markers as default scaffolding (01 / 02 / 03).** Only when the section actually IS a sequence.
- **Text overflow.** Test headings at every breakpoint.

## Commands

| Command | Description | Reference |
|---|---|---|
| `animate [target]` | Add purposeful animations and motion | [reference/animate.md](reference/animate.md) |
| `delight [target]` | Add personality and memorable micro-interactions | [reference/delight.md](reference/delight.md) |
| `overdrive [target]` | Push past conventional visual limits | [reference/overdrive.md](reference/overdrive.md) |

### Routing

1. **First word matches a command**: load its reference file and follow its instructions. Everything after the command name is the target.
2. **Intent maps to a command** (e.g. "make it more alive" → `animate`, "add micro-interactions" → `delight`, "go all out" → `overdrive`): load that command's reference and proceed.
3. **No clear match**: apply general design guidance using the full argument as context.
