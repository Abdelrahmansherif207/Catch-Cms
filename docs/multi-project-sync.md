# Multi-Project Sync Playbook

How the shared codebase serves multiple projects (brands) from one repo,
and how to move changes between `main` and the project branches without
losing anything.

## Model

- `main` is the **source of truth for mutual features and code** shared by all
  projects. It stays generic, reusable, and stable. It never contains
  project-specific branding, tokens, defaults, or features.
- Each project gets its own long-lived branch created from `main`:
  `git checkout -b project/<name> main` (e.g. `project/catch-beauty`,
  `project/meem-market-kuwait`). It starts identical to `main`, then diverges
  with its own design tokens, branding, logos, metadata, defaults, content,
  translations, and feature set (added, simplified, or removed).
- Project-specific work lives **only** on its project branch and is **never**
  merged back into `main`.
- Mutual work (features, fixes, UX improvements every project wants) lands on
  `main` via small pull requests, then each project branch pulls it down.

## Sync direction (one-way, merge only)

- `main` -> project branches via `git merge origin/main`.
- **Never rebase shared history.** Rebase recreates already-published brand
  commits (new hashes), abandons the originals, requires force-push, breaks
  other checkouts/CI/sync tooling, and replays the same conflicts once per
  commit. Merge preserves history, pushes normally, and resolves each conflict
  once.
- Preservation of brand files is decided by **conflict resolution**, not by
  strategy: merge and rebase converge on identical file content. Strategy only
  decides history shape and safety.

## Keeping syncs clean: brand-neutral PRs on main

Every hardcoded brand value in shared code is future conflict debt. Mutual PRs
on `main` must stay brand-neutral so they apply onto any brand untouched:

- CSS variables (e.g. `var(--color-primary)`) instead of hex values.
- i18n keys in `messages/*.json` instead of hardcoded strings.
- No brand names, logos, or project-specific defaults outside the project
  branches.

## Sync procedure (per project branch)

Run on the project branch with a clean tree:

1. `git fetch origin` — local `origin/main` goes stale; never trust it.
2. Recon: `git log --oneline <old>..origin/main` to enumerate incoming work.
   Intersect `git diff --name-only <old>...origin/main` with the files the brand
   touches (tokens, messages, branding, removed features) for the conflict
   surface.
3. Safety ref: `git branch backup/<project>-pre-sync <project>` (rollback
   point, deleted after a successful sync).
4. `git checkout <project> && git merge origin/main`.

## Standing conflict-resolution rule

- **Brand side wins** on design tokens, branding, logos, metadata, content,
  translations wording, and feature removals. A file the brand deleted stays
  deleted: "deleted here, unmodified there" auto-resolves; only a
  modify/delete (main touched a file the brand deleted) needs a human — keep
  the deletion.
- **`main` wins** on shared functionality and its additive changes: new
  components, new i18n keys, refactors of shared code.

## Verification after resolving

- `git status --short --branch`, `git diff --stat`, `npx tsc --noEmit`.
- `messages/*.json` still parse and keep brand wording plus main's new keys.
- Brand tokens intact (e.g. `rg "color-primary" src/app/globals.css`).
- Brand-only files untouched — the merge delta must equal main's delta
  file-for-file:
  `diff <(git diff --name-only <base>..HEAD) <(git diff --name-only <base>..origin/main)`.
- Reference folders absent from the diff; `main` itself untouched.

## Rollback

- Messy merge in progress: `git merge --abort` (branch unchanged).
- Bad merge commit: `git reset --hard backup/<project>-pre-sync`.
- Push only with explicit permission, and never `--force` on a project branch.

## Rolling out a new project

1. `git checkout -b project/<new-name> main` (starts with all mutual features).
2. Apply brand overlay commits (tokens, logos, metadata, content, feature
   set) following the feature-first folder rules in `AGENTS.md`.
3. From then on, sync with `main` using this playbook. The playbook itself
   arrives via the same channel — an ordinary merge.
