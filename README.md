# Gambier

A work-in-progress Markdown editor. 

Built with [Svelte](https://svelte.dev/) | [CodeMirror](https://codemirror.net/) | [Electron](https://www.electronjs.org/)

## Local development

1. Open a terminal session and run `npm run dev` to tell Rollup to process `src` files into `/app` and start watching for changes.
1. Open a second terminal session and run `npm run start` to open Electron (the local copy, found in `/node_modules/electron`), and load the contents of `/app`. Dependency NPM packages will also be loaded from `/node_modules`.

When we make changes to files in `/src`, Rollup watch will catch them, run itself again, and output files to `/app`. When Electron sees changes to the contents of `/app`, it will reload itself. This is implemented in `main.js` using [electron-reload](https://www.npmjs.com/package/electron-reload).

### Directories

* `/src` - Files that require processing (transpile / compile). Are output into `/app`.
* `/app` - Files that don’t require further processing. Are ready to go.
* `/assets` - Support assets for our builds. E.g. icons, marketing images, etc .
* `/dist` - Builds are output here.
