# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
make serve       # HTTP server on port 8816 (required for ES modules)
make convex      # Start Convex dev backend (npx convex dev)
make kill        # Kill the HTTP server on port 8816
npm install      # Install convex dependency (only needed once)
```

Both servers must run simultaneously for full functionality. The frontend imports Convex from `esm.sh` CDN at runtime, so the backend still needs `npx convex dev` to sync schema and functions.

## Architecture

Modular ES module frontend + Convex serverless backend. No build step.

**Frontend** (`js/`): Standard module split — `app.js` (entry, init + seed), `state.js` (Convex client, shared state, auth helpers), `data.js` (static lookup tables: ranks, badges, categories, monster icons, handler quotes), `render.js` (all DOM generation), `events.js` (all user interactions + `window.*` bindings), `utils.js` (helpers).

**Convex backend** (`convex/`): Three tables — `users`, `quests`, `hunters`. Functions in `auth.ts` (register/login) and `quests.ts` (CRUD, accept, complete, approve, seed).

**Convex client** is a `ConvexHttpClient` instantiated in `state.js` pointing to `https://good-fly-718.convex.cloud`. All mutations/queries go through `convex.mutation(api.quests.X, args)` — the `api` object in `state.js` maps string names to Convex function references.

## Key Patterns

**Quest lifecycle:** `requested` → (Guildmaster approves) → `posted` → (hunter accepts) → `active` → (all acceptors complete) → `completed`. Status transitions happen inside Convex mutations, not frontend.

**Role system:** Username `guildmaster` auto-assigns role `guildmaster` on register. Role is stored in `localStorage` under `guild-hall-role`. Guildmaster-only actions: post quests (`postQuestBtn`), approve requests (`approveQuest`). All logged-in hunters can: accept quests, complete quests, submit requests, edit tool suggestions.

**Auth:** Passwords are stored as `btoa(password)` — not cryptographically secure. `INVITE_PASSWORD` environment variable in Convex dashboard gates registration; omit it to allow open registration.

**Seeding:** On first load, `app.js` calls `seedIfEmpty` if the quest list is empty. This inserts 16 default missions (EKS, Temporal, Linkerd, etc.) with `postedBy: "Guildmaster"`. It is idempotent — won't re-seed if any quest exists.

**Monster icons:** SVG files live in `MHR_Monster_Icons_HD/svg/`. Each rank has a pool of 6 icons in `data.js` (`MHR_ICONS_BY_RANK`). `getMonsterIconForRank(rank, sublevel)` picks from the pool by 0-based sublevel index. The request form lets hunters pick from a `<select>` populated by `fillRequestSublevel()`.

**Badge computation** (`render.js:getHunterBadges`) is entirely client-side, derived from `state.quests` at render time — badges are not persisted to Convex (the `hunters.badges` field exists in schema but is not written by current code).

**`window.*` bindings:** `render.js` generates HTML with `onclick="window.openQuest(...)"`. All such handlers are bound in `events.js:bindEvents()` at the bottom of the function. When adding new onclick handlers in templates, always register them on `window` in `bindEvents`.

**No polling:** The frontend uses `ConvexHttpClient` (HTTP, not WebSocket), so it does not receive real-time updates. Every mutation in `events.js` calls `refetchQuests()` after completion to manually pull fresh state.
