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

## Bundling

* `main.js` and `preload.js` are output as CommonJS modules.
        * I use ES6 module syntax (import/export) in source for consistency with `renderer`, so I'm using same approach project-wide. Rollup then transpiles back to CommonJS.
        * Third-party dependencies are not bundled. They live in `node_modules`.

* `renderer.js` is output as ES6 module, with dependency imports bundled.
        * Third-party dependencies are bundled. 
        * Except CodeMirror. For now I'm leaving it in node_modules, and linking to it from html `<script>` tags.

## Security

Renderer
* Don’t use require
* Use rollup for bundling. 
* FormatL ES6, or IIFE (TBD)
* For third-party client-side dependencies (e.g. citeproc), either bundle from NPM, or load from script tags into global(?) space (ala that CDN recommendation)

Main and preload

* Use require for dependencies (node modules, electron, node, etc)
* Don’t use rollup (for now, to simplify problems)
* Expose anything needed from Node/Electron/3P to renderer process via…
