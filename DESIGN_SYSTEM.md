# Napkin UI foundations

This is a small shared UI foundation, not a separate component library.

- Use the semantic CSS variables in `apps/web/src/index.css`: ink, paper, cream, line, cobalt, orange, font-sans and font-serif. Avoid nearby hardcoded copies of these brand values.
- Reuse `components/ui/button.tsx` for standard actions and its existing variants/sizes. Use the Radix-backed Dialog and DropdownMenu for layered interactions and their keyboard/focus behavior.
- Keep identity assets and logo rendering in `components/brand`; use NapkinIdentity instead of rebuilding the logo per page.
- Keep feature layout, responsive grids, charts and tables with the feature. Extract another shared primitive only when multiple features genuinely share behavior or structure.
- Use dark ink for readable secondary copy. Indicate hierarchy with size, weight and spacing rather than faint text.
- New shared behavior belongs in `components/ui`; reusable product layout belongs in a dedicated shared layout folder. External synchronization belongs in narrowly named hooks, never direct component effects.

The admin follows these rules for brand colors, fonts, identity and standard actions. Its navigation and native reporting-period select remain feature-specific. Existing global page CSS has not been broadly rewritten: migrate it incrementally when touching the corresponding feature to avoid visual regressions.
