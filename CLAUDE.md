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
URL). Model files in `public/models/` are user-supplied `.glb`s, committed to
the repo but never imported into the bundle, and the default game path stays
fully procedural — unless a character is deliberately set to `model` in
`HEAD_STYLE` (`src/art/builders/headstyle.js`), the table the faces bench
(`/workbench/?edit=faces`) exports, which makes that one character load its
manifest model by default.

## Tests and deploys

Pushes to `main` build and deploy only; they run no tests. Tests are your job
before you commit:

- Run the tests your change affects: `npm run build` must pass for any change,
  and a change to the `fable5.1/` build also runs `node fable5.1/test/run.mjs`.
  The game at `/` has no automated tests; check it in a browser (`npm run dev`)
  before committing. For a change to shared code, run all of them.
- Say in the commit message what you ran and that it passed.

Every deploy is paid for in GitHub Actions minutes while the repository is
private, so batch a task's work into one push to `main` at the end rather than
pushing after every small step. Pushes to a working branch run nothing. A newer
push cancels a deploy still in progress, so a burst of pushes publishes only the
last one.

## Models

- Only a session already running on Fable may start Fable subagents, workers or helper agents. Opus,
  Sonnet and every other model never pass model "fable"; they leave the model unset so it inherits, or
  pick Opus or Sonnet.
- Don't switch a session to Fable on your own. If a task seems to need Fable, ask me first and say why.
- This is enforced in `.claude/settings.json`: sessions in this repository default to Opus, and a
  PreToolUse hook (`.claude/hooks/block-fable.sh`) reads the calling model from the transcript and
  refuses a subagent or workflow call that asks for Fable unless the caller is itself Fable. When I ask
  for Fable, switch the main session with `/model`; don't edit the hook to get round it.
