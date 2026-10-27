# The Lost Islands

A browser-based 3D AppSec adventure: explore four coastal islands as Zoro, solve twenty fictional security investigations, restore the ferry connections, and find Luffy at the ship.

## Run

Node.js 24 is recommended.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Verify and build

```sh
npm test
npm run build
npx vite preview --host 127.0.0.1 --configLoader runner
```

The production files are generated in `dist/`. The source export includes the lockfile; dependencies and generated output are excluded.

## Play

- WASD or arrow keys move; E interacts. Click a valid destination or use the objective arrow to walk automatically.
- On smaller screens, hold an on-screen direction button and tap the nearby interaction prompt.
- Solve five investigations per island to restore its ferry connection.
- Hints and step-by-step guided solutions are optional. Independent completion earns 100 points; guided completion earns 20. Practice does not duplicate rewards.
- Settings provide reduced motion, graphics quality, reading size, and nickname changes.
- Reset controls offer a challenge reset, island practice, or full adventure reset. Progress is stored in the browser per origin.

## Educational content

Five investigations each cover object-level authorization (IDOR), cross-site scripting, file-upload security, and web cache poisoning. Every challenge includes discovery, explanation, repair, behavioral verification, debrief, and a transfer question. All data and security operations are fictional local simulations.

## Architecture

TypeScript, Vite, Three.js, and native DOM overlays. Security simulation and policy evaluation are separate from presentation. Shared surface definitions drive terrain, water/bridge boundaries, navigation, and movement. Island presentation, ferry travel, character models, persistence, hints, and scoring are modular.

## Validation record

The latest local checks passed **65 automated tests** and the TypeScript/Vite production build. A browser playthrough completed twenty challenges at 720 points (four independent and sixteen guided), followed by a five-challenge practice replay with no extra points. Layouts were inspected at 1440×900, 1280×720, 768×1024, and 390×844. Physical mobile devices and other GPUs have not been tested. See `docs/QA-REPORT.md` and `docs/ISSUE-LOG.md` for scope and limitations; screenshots and recordings remain in the local review folder and are not bundled in this repository.

## Assets

The scene uses original procedural meshes. Zoro and Luffy are unofficial fan-art depictions; no license to the underlying characters is claimed. Dependency notices are in `licenses/`; see `ASSET-PROVENANCE.md`.

This export contains no hosting configuration, credentials, saved browser progress, or review recordings.
