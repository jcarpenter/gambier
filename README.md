# Gambier

An experimental markdown editor.

## Keyboard Shortcuts

* `Shift-Cmd-K`: Delete line
* `Cmd-L`: Select line
* `Shift-Alt-Down`: Duplicate line
* `Cmd-D`: Select next occurrence
* `Alt-Up`: Swap line up
* `Alt-Down`: Swap line down
* `Shift-Ctrl-Up`: Add cursor to previous line
* `Shift-Ctrl-Down`: Add cursor to next line
* `Enter`: New line and continue list
* `Tab`: Indent list
* `Shift-Tab`: Un-indent list

We use CodeMirror's [Sublime Keymap](https://codemirror.net/demo/sublime.html).

Bracket closing is enabled by the [closebrackets](https://codemirror.net/doc/manual.html#addon_closebrackets) CodeMirror addon. 

## Styling

Style the app UI with:

* App.scss: 
  * For basic non-themeable styles.
  * Lives in `src/styles/app.scss`. Compiles to `app/styles/app.css`.
  * Linked from `index.html`.

* Theme stylesheets
  * For unique theme-specific styles.
  * Edit in `src/styles/themes/`. Compiles to `app/styles/themes/`
  * Each theme's .css file must live in folder of the same name. E.g. `solaris` folder contains `solaris.css`. 
  * The top-level theme class must follow convention format `.cm-s-[name]`. E.g. `.cm-s-solaris`. Per the CodeMirror [requirements](https://codemirror.net/doc/manual.html#option_theme).
  * Non-editor-specific styles can live in top-level of stylesheet.
  * Is loaded into the app by `setTheme` function in renderer.js. It detects `state.theme` changes, and inserts the new theme's `href` into the `<link rel="stylesheet" id="theme-stylesheet" href="">` element in the head of index.html.
  * Is applied to CodeMirror by Editor.svelte. It detects `state.theme` changes, and sets the new `state.theme` value (e.g. 'gambier-light') on our CodeMirror instance: `cm.setOption('theme', state.theme)`. This adds `.cm-s-gambier-light` to the class list of the top-level Editor element.

Note: We're not using styles inside Svelte components currently (2/10/2020). Because it makes themeing unnecessarily hard. Once we have a better understanding of what is consistent between themes, we can extract non-changing styles into component styles, and/or app.scss.

## Editor Widgets

* editor.js: `findAndMark`. "Find each citation in the specified line, and collape + replace them." 

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

## Security

Main and preload access sensitive low-level dependencies (electron, node, third party packages, etc). Render process code does not. It is isolated. It requests what it needs from main process via IPC channels exposed in preload. Render process code also cannot  `require` NPM packages.

## Main process dependencies

* `main.js` and `preload.js` are output as CJS modules.
* Third-party dependencies are not bundled. They live in `node_modules`. Electron-builder `postinstall` takes care of copying the dependencies at build time (see notes above).
* I use ES6 module syntax (import/export) for sake of consistency with Render process code, so I'm using same syntax project-wide. Rollup then transpiles back to CommonJS.

## Render process dependencies

There are several options:

1. Bundle them with Rollup. Works for ES6 modules or NPM packages.
2. Import at run time. Only works for ES6 modules.
3. Load into and access from the global namespace. Works for UMD modules and (old-school) raw JS files.

### Examples

Bundle with Rollup:

```bash
// terminal
npm i -D citeproc
```

```json
// package.json
"devDependencies": {
  "citeproc": "^2.3.8",
}
```

```js
// main.js
// Two examples: Importing local ES6 module, relative to main.js, and importing citeproc from  `node_modules`.
import test from './test'
import csl from 'citeproc'
test()
citeproc = new csl.Engine(...) // etc

// rollup.config.js
// To bundle `node_modules` packages we need the node-resolve and commonjs plugins.
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default [
  {
    input: 'src/js/main.js',
    output: {
      format: 'es',
      file: 'app/js/main.js',
    },
    plugins: [
      resolve(), 
      commonjs()
    ]
  }
]

// index.html
// Load the our bundled JS file. Note: `type="module"` isn't necessary unless we're also importing external dependencies into main at runtime (see example below).
<script src="./js/main.js"></script>
```

Import at run time, without bundling:

```js
// main.js
// Use a relative path for the dependency. Relative to where the output main.js will be. Rollup does not try to bundle relative paths.
import test from './third-party/test.js'
test()

// rollup.config.js
// Rollup will throw error until we put the same path into the `external` property of rollup.config.js.
input: 'src/js/main.js',
output: {
  format: 'es',
  file: 'app/js/main.js',
},
external: [
  './third-party/test.js',
]

// index.html
// Load the module and our bundled JS into our html file. Must use `type="module"` for both.
<script src="./js/third-party/test.js" type="module"></script>
<script src="./js/main.js" type="module"></script>
```

Load into and access from the global namespace.

```js
// index.html - Simply load the file. No `type="module"`
<script src="./js/third-party/citeproc/citeproc.js"></script>

// rollup.config.js
// Nothing to do here!

// main.js
// Access the global name. No need to `import`
console.log(CSL)
```