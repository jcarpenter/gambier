# Gambier

An experimental markdown editor.

## Structure

* `src` - Files that require processing (transpile / compile). Are output into `app`.
* `app` - Files that don’t require further processing. Are ready to be packaged into our builds.
* `assets` - Support assets for our builds. E.g. icons, marketing images, etc .
* `dist` - Builds are output here.

## Development

* `npm run build` - Process files from `src`. Outputs to `app`.
* `npm run start` - Load our app (from the `app` directory) in our local build of electron (from top-level `node_modules`). Any third-party dependency NPM packages are also loaded from `node_modules`.

## Building executables and installers

These commands bundle electron (the version specified in package.json `devDependencies`), `app`, `assets`, and any of our dependency npm packages into executables and distributable installers (e.g. dmg), and output to `dist`. 

We use [electron-builder](https://www.electron.build) for the build. Per configurations in `electron-builder.yml` and `package.json`. Dependency copying is handled by `"postinstall": "electron-builder install-app-deps"` npm script, which runs automatically after `electron-builder` commands.

* `npm run pack` - Builds just the executable, for just the local OS/architecture. Does not create installers, etc. Uses `--dir` electron-builder setting ([docs](https://www.electron.build/cli)). Useful for quickly testing.
* `npm run release` - Builds both the executable for the local OS/architecture, and distributable installers.

## Dependencies and bundling

We use Rollup for bundling. See `rollup.config.js`.

Main process:

* `main.js` and `preload.js` are output as CJS modules.
* Third-party dependencies are not bundled. They live in `node_modules`. Electron-builder `postinstall` takes care of copying the dependencies at build time (see notes above).
* I use ES6 module syntax (import/export) for sake of consistency with Render process code, so I'm using same syntax project-wide. Rollup then transpiles back to CommonJS.

Render process:

* Output as ES6 modules. 
* Third-party dependencies are bundled. E.g. citeproc. It 925kb, unminified and has no dependencies. It is only distributed as CJS module. We bundle with Rollup.
* Except CodeMirror. It's only distributed as an IIFE. For now, I'm copying relevant files to `./js/third-party/codemirror/`, and linking to them from html `<script>` tags.

## Security

Main and preload access sensitive low-level dependencies (electron, node, third party packages, etc). Render process code does not. It is isolated. It requests what it needs from main process via IPC channels exposed in preload. Render process code also cannot  
`require` NPM packages.
