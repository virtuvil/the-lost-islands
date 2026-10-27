# The Lost Islands — coastal review candidate

Local candidate; not published. The first-island coastal milestone was approved in this conversation before its treatment was extended to the other islands. This report describes observed checks and their limits, rather than approval of every final detail.

## What changed

The river, terrain and navigation now share one world-space surface model. Ground, blocked water, bridge decks, repairable pier sections, ferry decks, gangplanks, ship decks and themed obstacles are explicit. The character radius is included; swept movement and A-star edges prevent shortcuts through the channel. Invalid water destinations produce a short explanation.

Inter-island travel now uses a visible ferry. Five investigations rebuild five pier sections; the complete pier enables boarding. Zoro rides across the channel, steps onto an arrival pier, and continues at the next island's dock. The arrival scenery previews that island's actual themed kit. Scenes remain separate island locations, not a falsely continuous walkable map.

The coastal treatment adds sculpted riverbanks, varied headland clusters, a reading turret, planted terraces, softer foliage, depth-colored muted water and restrained lighting. Existing garden, workshop and observatory landmarks are retained and integrated with the shared terrain treatment. Zoro and Luffy remain the original articulated procedural fan-art models. Inspection now removes obstructing scenery/rigging and clearly exposes all three sheaths. Mobile controls, responsive spacing, completed exploration height and quality switching were repaired.

The twenty deterministic AppSec simulations, fictional data, policy controls, guided demonstrations, hints, debriefs, transfer questions, saved progress and duplicate-reward protections were retained.

## Automated verification

- **65 tests passed, zero failed.** See `tests.txt` for the actual output.
- TypeScript and Vite production build succeeded. See `build.txt` for the emitted asset sizes and build result.
- Added regressions cover the entire rendered river, radius clearance, both bridge directions, diagonal/parapet restrictions, long frames through the old blocked strip, path-edge validity, themed obstacle sets, valid arrival recovery, repaired-pier gating, ferry/arrival decks and connected dock/gangplank/ship surfaces.
- Existing tests still cover all twenty attack/repair simulations, every missing required repair control, legitimate behavior, authorization mutations, nested relationships, cache behavior, scoring, route gates, save validation and cancellation.

## Actual browser playthrough

Tested through the ChatGPT in-app browser on this Windows workspace. The frozen production build was served locally at `http://127.0.0.1:5175/`; development preview remains at `http://127.0.0.1:5174/`.

From a fresh production-origin save, completed all twenty investigations in order and reached the boat. The first mission of each family was solved independently through normal use, exploitation, root-cause selection, repair, verification, debrief and transfer. Sixteen other missions used their visible four-stage guided demonstrations. Total: **720 points**, four independent and sixteen guided classifications. `production-journey.json` captures the actual completed lesson list after this run. Intentional reload checks before/after crossing preserved the same adventure; no progress reset or injected save was used to advance it.

Checked wrong reasoning and an incomplete ownership repair: neither completed the challenge. Ownership verification preserved the owner's 200 response and returned 403 for another owner, with anonymous requests denied. XSS rendered the harmless marker in the opaque-origin lab before repair; text rendering preserved normal content and prevented execution after repair. Upload checks preserved a valid image and rejected unsupported content. The cache repair removed untrusted influence and invalidated poisoned entries; omitting invalidation failed clean-visitor verification.

Checked a four-completion route lock, fifth-completion restoration, normal ferry travel, skipped travel, reduced-motion travel, normal reunion/boarding, skipped and reduced-motion completion, saved completed exploration and immediate lesson access. Resetting during queued upload processing cleared its state. Cancelling travel kept the next island locked after the old sequence's end time. Full reset during actual boarding retained zero progress rather than receiving a stale completion.

Replayed an entire five-challenge island after completion: every replay awarded **0 new points**, total remained **720**, and practice ended at **5/5**. All three hints were voluntarily requested. Naming rejects empty/overlong values, trims whitespace, displays angle brackets literally, and renaming preserves scores/progress. These are browser checks in addition to the logic tests.

The final presentation/quality fixes received focused retests after the full production journey; the educational domain logic did not change during them. See the issue log for the exact observations and resolutions.

## Visual and input review

Exploration, map, investigation and finale/completion were captured at **1440×900, 1280×720, 768×1024 and 390×844**. The gallery includes the full matrix. Still-image matrix captures use reduced motion to make comparison stable; normal motion was separately observed during travel, character views and the finale.

Keyboard, diagonal keyboard, click-to-walk and objective-driven navigation were used. Actual diagonal movement crossed the bridge from the east bank to the west bank. The original upstream water click was reproduced before changes, then rejected after changes. Held D remained on the bank. Sampled browser recordings and surface/position logs are included. Long-frame behavior is additionally covered by deterministic tests; this is not a claim that browser rendering was artificially throttled.

On-screen directional movement was exercised using a held pointer in the simulated 390×844 viewport and stopped on release. It uses the same collision model. This is **not physical-phone touch testing**. Desktop remains the primary experience.

The learner inspection found clear current objectives, named destinations, normal/investigation presets, response evidence, actionable repair verification, optional hints and short guided stages. Real first-time learner sessions would still be useful for terminology, pacing and the advanced cache investigations. No real-user usability study was conducted.

## Performance and recovery limits

Measured renderer observations are in `performance.json`; graphics-setting checks are in `graphics-check.json`. These are browser requestAnimationFrame intervals and draw statistics in the available environment, not a cross-device frame-rate guarantee. Startup latency and end-to-end input latency were not instrumented. The High/Low selector and reduced-motion mode are available.

No errors were present in the final captured browser error log. Existing visible graphics/storage recovery paths remain implemented, but forced context loss, denied storage, other browsers, physical mobile devices and other GPUs were not manually tested.

## Assets and architecture

All added terrain, river, headlands, turret, pier, ferry and arrival scenery are original procedural meshes. No external image or model pack was downloaded. Existing unofficial Zoro/Luffy fan-art meshes were retained; they are not official licensed character assets. Three.js and DOMPurify notices remain in `licenses/` and `ASSET-PROVENANCE.md`.

Main changed files: `src/surfaces.ts`, `navigation.ts`, `assets.ts`, `coastal-headlands.ts`, `coastal-passage.ts`, `harbor-assets.ts`, `game-world.ts`, `main.ts`, `style.css`, `journey-map.ts`, and `tests/river-navigation.test.ts`. Educational simulation modules were preserved. Rendering, surface classification/navigation, voyage presentation and lesson/scoring/persistence remain separate modules.

## Run and review

In `outputs/lost-islands`, use Node 24 and run `npm ci`, `npm test`, then `npm run dev -- --port 5174`. Build with `npm run build`; inspect the production output with `npx vite preview --host 127.0.0.1 --port 5175 --configLoader runner`.

For deployment after explicit publication approval, serve `dist/` through the existing Sites project while preserving its project identity/audience. The archive excludes `node_modules`, Git metadata, hosting credentials and runtime saves. No publication occurred during this work.

Review `index.html` for before/after stills, sampled crossing recordings, character views and the viewport matrix. The candidate is prepared for review within the stated environment; remaining untested environments are listed above.
