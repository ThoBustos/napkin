# Napkin engineering guidelines

- Do not call `useEffect` directly in components. Derive render values inline, perform interaction work in event handlers, and use a query abstraction for server data.
- External synchronization belongs in a narrowly named custom hook under `apps/web/src/hooks`, with symmetrical setup and cleanup.
- Prefer an accessible UI primitive for menus, dialogs, and other layered interactions instead of recreating focus and dismissal behavior.
- Put cross-feature primitives in `components/ui`, shared product identity and layout in dedicated shared component folders, and feature-specific code with its feature.
- Use a reducer when several state values form one workflow and can otherwise enter invalid combinations.
