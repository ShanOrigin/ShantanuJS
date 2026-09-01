# ShantanuJS release pipeline

This guide describes every local command and the GitHub CI/CD flow used to release `shantanujs` safely.

## Requirements

- Node.js 22 or later
- npm
- For publishing: npm publish permission and a GitHub repository secret named `NPM_TOKEN`

Install the exact locked dependencies before any release check:

```powershell
npm ci
```

Input: `package-lock.json`.

Output: a reproducible `node_modules` directory. Use `npm ci` for checks and releases; do not use `npm install` because it can change the lockfile.

## Commands

| Command | What it does | Output |
| --- | --- | --- |
| `npm run clean` | Deletes `dist` and clears TypeScript build metadata. | No distributable files remain. |
| `npm run build` | Cleans, emits declarations, copies source declarations, bundles ESM/CJS/browser files, then packs npm tarball. | `dist/distribution/*` and `shantanujs-<version>.tgz`. |
| `npm run check:package` | Installs the generated tarball in a temporary directory and validates consumer entry points. | `PASS:` line for each check, or `FAIL:` plus the command error. |
| `npm run cirdep:index` | Analyses the public entry point for circular dependencies. | Dependency graph and circular-dependency status. |
| `npm run verify` | Runs build, package validation, and dependency analysis in sequence. | A release-ready tarball only when every stage succeeds. |

## What `check:package` validates

The check fails immediately on the first failing stage and exits with status `1`. A successful stage prints `PASS:` and proceeds to the next stage.

1. Installs the newly generated `.tgz` in a temporary empty project.
2. Compiles a TypeScript consumer importing `ShantanuJS` and its public instance types.
3. Imports the ESM package from a `.mjs` consumer.
4. Imports the ESM package dynamically from a `.js` consumer.
5. Requires the CommonJS package from a `.cjs` consumer.

The runtime checks provide the minimum `document` global needed for module loading. They verify package resolution and entry points; they do not replace browser rendering tests.

## Local release procedure

1. Update `version` in `package.json`.
2. Run the complete gate:

   ```powershell
   npm ci
   npm run verify
   ```

3. Confirm the final line is `PASS: packed package verification complete` and the tarball exists:

   ```powershell
   Get-ChildItem shantanujs-*.tgz
   ```

4. Commit the version and release changes.
5. Create and push a matching tag. For version `0.1.0-beta.1`:

   ```powershell
   git tag v0.1.0-beta.1
   git push origin v0.1.0-beta.1
   ```

The tag text after `v` must exactly equal `package.json`'s version. The publish workflow rejects a mismatch.

## CI pipeline

[`ci.yml`](.github/workflows/ci.yml) runs for every pull request and push to `main`.

1. Checks out the repository.
2. Installs Node.js 22 and restores npm cache.
3. Runs `npm ci`.
4. Runs `npm run verify`.
5. Uploads `shantanujs-*.tgz` as the `npm-package` workflow artifact.

CI never publishes to npm.

## CD pipeline

[`release.yml`](.github/workflows/release.yml) runs only when a `v*` tag is pushed.

1. Repeats the full CI verification.
2. Confirms tag version equals the package version.
3. Publishes the already verified tarball with `npm publish ./shantanujs-*.tgz --access public`.

Before the first publish, add `NPM_TOKEN` in GitHub repository settings under **Secrets and variables → Actions**. The token needs permission to publish this npm package.
