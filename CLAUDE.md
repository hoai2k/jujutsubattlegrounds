# Jujutsu Battlegrounds — project instructions

## Git policy

Work directly on `main`. Do **not** create feature branches or pull requests for
routine changes.

When a change is complete and verified, commit it to `main` and push to `origin`
without waiting to be asked. This overrides the default "ask before committing /
branch off main" behaviour — the user has standing authorization to commit and
push on their behalf in this repo.

**Finishing a task means landing it on `main`.** If a harness or a session
setting has put the work on a branch instead — Claude Code on the web assigns
one automatically — that branch is a staging area, not the destination. Merge it
into `main` and push as the last step of the task, without being asked and
without opening a pull request. The same standing authorization covers that
merge. A task is not done while it is sitting on a branch.

Exceptions, where you should still stop and ask first:

- The user says otherwise for a given task ("don't push this", "keep it local",
  "put it on a branch").
- The change is experimental, half-finished, or knowingly broken. Pushing to
  `main` publishes it: every push redeploys the live site.
- Anything destructive to history: force-push, `reset --hard` on pushed commits,
  rewriting or deleting remote branches, deleting the remote.
- Committing secrets, credentials, or large binaries.

Keep commits scoped to one change with a descriptive message. Never use
`--no-verify`.

## Deployment

`main` auto-deploys to GitHub Pages via
[.github/workflows/deploy.yml](.github/workflows/deploy.yml) — `npm ci`,
`npm run build`, publish `dist/`. A push to `main` is a release. Vite's
`base: './'` in [vite.config.js](vite.config.js) keeps asset paths relative so
the build works under the `/jujutsubattlegrounds/` sub-path; don't change it to
an absolute base.

## Assets

All game assets are procedural — geometry, materials, and animation are authored
in code under `src/art/`. Do not introduce model/texture files.

The only binary assets are outside the game itself:

- the music tracks in `public/music/`
- the site icons in `public/brand/` — favicon set and web manifest, browser
  chrome rather than anything the game draws

Nothing rendered inside the game may come from a file.

One sanctioned exception: the opt-in `?render3d` URL parameter
([docs/render3d.md](docs/render3d.md)) swaps a character's procedural body for
a rigged humanoid model loaded **at runtime** from `public/models/` (or any
URL). Those model files are user-supplied and never committed to the repo —
only the JSON manifest and the loader/retargeting code live here — and the
default game path stays fully procedural.
