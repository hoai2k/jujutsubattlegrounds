# Cursed Arena — project instructions

## Git policy

Work directly on `main`. Do **not** create feature branches or pull requests for
routine changes.

When a change is complete and verified, commit it to `main` and push to `origin`
without waiting to be asked. This overrides the default "ask before committing /
branch off main" behaviour — the user has standing authorization to commit and
push on their behalf in this repo.

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
in code under `src/art/`. The only binary assets are the music tracks in
`public/music/`. Do not introduce model/texture files.
