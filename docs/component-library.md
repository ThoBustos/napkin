# Component library

## Principles

- Question and requested output dominate active training.
- Use warm cream for the application ground and white for working surfaces.
- Navy carries content; cobalt indicates action or instruction; orange is reserved for time and streak signals.
- Prefer thin borders, 7px control radii, 16px large-surface radii and restrained shadows.
- Use serif type for business questions and sans/mono type for interface and numbers.
- Every interactive element has visible keyboard focus and a 44px minimum touch target.

## Tokens

| Token | Value | Use |
|---|---:|---|
| Cream | `#f6f4ed` | application ground |
| Paper | `#fffefa` | working surfaces |
| Ink | `#101c35` | primary text and outlines |
| Cobalt | `#2053e8` | actions and instructional states |
| Orange | `#ec603e` | time, streak and urgency |
| Muted | `#6e746f` | supporting copy |
| Line | `#d8d5cc` | dividers and borders |

## Foundations

- `Button`: default, outline and ghost variants; three sizes.
- `BrandMark`: square N mark and wordmark.
- Typography: bounded responsive display sizes, business question, body, UI label and tabular number styles. Avoid viewport-only text sizing so content remains usable when zoomed.
- Surface: paper panel with hairline border and optional restrained shadow.

## Typography candidates

- `?font=geist` — Geist + Newsreader; clean and closest to the selected hero.
- `?font=manrope` — Manrope + Source Serif 4; warmer and approachable.
- `?font=instrument` — Instrument Sans + Lora; sharp and editorial.
- `?font=exercise` — DM Sans + Newsreader; preserved from the exercise-view system.

Fonts are self-hosted through pinned Fontsource packages. The final selection should replace these temporary variants.

## Product components

- `SiteHeader`: public navigation and entry action.
- `SessionSetup`: topic, mode and duration selection.
- `ExercisePrompt`: category, question and explicit requested unit.
- `AnswerField`: numeric input with persistent unit.
- `SessionTimer`: one countdown across a session.
- `Hint`: optional progressive guidance.
- `Scratchpad`: optional working area.
- `AnswerDebrief`: correctness, two calculation paths and business implication.
- `SessionSummary`: solved, correct and accuracy.

Only `Button`, `BrandMark`, `SiteHeader` and the landing-page product preview are implemented in the first landing slice. New primitives should follow shadcn/ui conventions and live under `components/ui`; product-specific compositions live outside that directory.
