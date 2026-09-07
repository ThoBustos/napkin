# Executive catalog

`executive-questions.json` transcribes the eleven supplied 2026-09-07 executive question batches. It preserves their prompts, answers, tolerances, difficulty, friendliness and operation counts, including the reviewed CEO batch. Each row adds an independently derived `verification_expression`, used only by validation and never stored in the serving database.

Run `pnpm catalog:validate` to verify all 110 answers, required metadata, taxonomy membership, slug and prompt uniqueness, two-decimal precision, category diversity, tolerance and the 5/3/2 distribution in every track. `pnpm test` also exercises rejection of invalid content. The validator checks that the SQL migration is an exact rendering of the source.

## Editorial calibration

The supplied difficulty labels are editorial decisions, not mechanically calculated labels. The source operation counts sometimes count conversion, comparisons or conceptual steps differently from the minimum-operations rubric. For example, the CTO energy question has one multiplication but is medium because it tests the distinction between power and energy; the CEO post-synergy multiple has two operations but is medium because it requires selecting the adjusted earnings denominator. Payback questions also have medium labels even where their arithmetic is a single division. These source metadata choices are retained explicitly for catalog review, rather than silently changing the supplied distribution. The validator verifies arithmetic, not conceptual difficulty or the editorial operation count.

## Publishing and precision

The initial catalog is inserted by `20260907001000_seed_executive_questions.sql`. Migration version tracking prevents replay; duplicate slugs fail loudly rather than updating existing questions. No legacy row is changed. Apply schema before content and deploy the track-aware application only after both migrations.

Canonical answers have at most two decimals. Practice asks for rounding to two decimals when necessary and accepts the stored absolute tolerance, with a small floating-point boundary allowance. Answers such as 26.67% intentionally accept reasonable mental approximations. Friendliness 5 is excluded from this release.

For future releases, review source files in a PR and use a trusted idempotent importer keyed by stable slug. Never overwrite a previously answered question's meaning: create a new slug and retire the old row. Publishing credentials stay outside the browser. The importer is a future workflow, not part of this initial migration.
