# Gambier

An experimental markdown editor.

## Features

### Keyboard Shortcuts

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

## MacOS Conformability

We want to be a good citizen macOS app! We support the following features

### Theming

Initially, we have just two themes: light and dark. They style both the app UI, and the editor text. In the future we'll hopefully support multiple editor text themes, and possibly (lower priority) app UI themes.

* In `View > Appearance`, user can choose between Match System, Light, or Dark. We track their selection in the `theme.app` store property. When they make a change, we do the following:
  * Set `nativeTheme.themeSource`: Per [Electron docs](https://www.electronjs.org/docs/api/native-theme#nativethemethemesource), this tells Chromium to render OS UI in dark or light mode (e.g. window frames), and sets [prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme). The later is picked up by media queries in our CSS. (AppearanceManager.js)
  * Get updated OS colors and apply them to the document as CSS variables. (renderer.js)
  * Get updated editor theme name and set it as stylesheet (StateManager.js) This won't actually change for now, but the code is here with future flexibility in mind.

### App Icon

* See: https://www.electron.build/icons
* See: [Apple HIG: App Icon](https://developer.apple.com/design/human-interface-guidelines/macos/icons-and-images/app-icon/)  
* Mac:  
  * PNG.
  * Color space: Display P3 (wide-gamut color), sRGB (color), or Gray Gamma 2.2 (grayscale)
  * Layers: Flattened with transparency as appropriate
  * Manually create icon alpha (e.g. rounded rect and drop shadow), and incude in export (as I understand it).
  * Specify in `electron-builder.yml` settings, under mac key, ala `icon: "icon_512x512.png"`. Path is relative to the `assets` directory. Per https://www.electron.build/configuration/mac.
* A Sketch macOS icon template is available from [Apple Design Resources](https://developer.apple.com/design/resources/).


## Development

### Project structure

* `src` - Files that require processing (transpile / compile). Are output into `app`.
* `app` - Files that don’t require further processing. Are ready to be packaged into our builds.
* `assets` - Support assets for our builds. E.g. icons, marketing images, etc .
* `dist` - Builds are output here.

### Scripts

* `npm run build` - Process files from `src`. Outputs to `app`.
* `npm run start` - Load our app (from the `app` directory) in our local build of electron (from top-level `node_modules`). Any third-party dependency NPM packages are also loaded from `node_modules`.

### Development-only code

We use `if (!app.isPackaged) { ... }` to define code that should only be run if the app is NOT packaged (that is to say, in a development enviroment).

### Styles

Style the app UI with:

* App.scss: 
  * For basic non-themeable styles.
  * Lives in `src/styles/app.scss`. Compiles to `app/styles/app.css`.
  * Linked from `index.html`.

* Theme stylesheets
  * For theme-specific styles.
  * Edit in `src/styles/themes/`. Compiles to `app/styles/themes/`
  * Each theme's .css file must live in folder of the same name. E.g. `solaris` folder contains `solaris.css`. 
  * CodeMirror-styles must live under a top-level `.cm-s-[name]` class. E.g. `.cm-s-solaris { ... }`. Per the CodeMirror [requirements](https://codemirror.net/doc/manual.html#option_theme).

Note: We're not using styles inside Svelte components currently (2/10/2020). Because it makes themeing unnecessarily hard. Once we have a better understanding of what is consistent between themes, we can extract non-changing styles into component styles, and/or app.scss.

### Dependencies

I use ES6 module `import/export` syntax (instead of CommonJS) project-wide during development, for the sake of consistency. Rollup then transpiles `main.js` and `preload.js` back to CJS syntax.

#### Main process dependencies

Third-party NPM packages for use by main process are _copied_ (not bundled) into our build by electron-builder, at build time. See `"postinstall": "electron-builder install-app-deps",` in package.json. NOTE: This script also ensures "...your native dependencies are always matched electron version" ([docs](https://www.electron.build/index.html)).

What is a main-process only dependency? For example: anything that touches the file system (e.g. path, chokidar). 

To install a new third-party NPM package to be used by main process do the following:

* Install into `dependencies`. E.g. `npm i nanoid`
  * NOTE: It also works if we install into `devDependencies`, but conceptually I find it helps to keep run time dependencies distinct from build-related dependencies.
* Add to `external` array in `rollup.config.js` (under the first `main.js` object). E.g. `external: ['nanoid'].
* Use in code with `import { nanoid } from 'nanoid'.

##### Why not bundle main process dependencies, the same way we bundle render dependencies? 

Nov 3 2020: I can't recall why I went this path. Possibly it's a performance thing. But that doesn't make a lot of sense. Electron docs [specifically recommend](https://www.electronjs.org/docs/tutorial/performance#7-bundle-your-code) bundling modules to reduce `require()` calls:

> ...calling require() is an expensive operation. If you are able to do so, bundle your application's code into a single file. ...to ensure that the overhead included in calling require() is only paid once when your application loads.


#### Render process dependencies

There are several ways to work with dependencies in the render process:

1. Bundle them with Rollup. Works for ES6 modules or NPM packages.
2. Import at run time. Only works for ES6 modules.
3. Load into and access from the global namespace. Works for UMD modules and (old-school) raw JS files.

##### How to: Bundle NPM dependencies with Rollup:

```bash
// terminal: Install into dependencies
npm i citeproc
```

```json
// package.json: Install adds to `dependencies`.
"dependencies": {
  "citeproc": "^2.3.8",
}
```

```js
// main.js: Import from  `node_modules`.
import csl from 'citeproc'
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

##### How to: Import ES6 module at run time, without bundling:

```js
// main.js: Use a relative path for the dependency. Relative to where the output main.js will be. Rollup does not try to bundle relative paths.
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

##### How to: Load UMD and old-school JS files into global namespace

```js
// index.html - Simply load the file. No `type="module"`
<script src="./js/third-party/citeproc/citeproc.js"></script>

// rollup.config.js
// Nothing to do here!

// main.js
// Access the global name. No need to `import`
console.log(CSL)
```

## State

TODO

## Security

Main and preload access sensitive low-level dependencies (electron, node, third party packages, etc). Render process code does not. It is isolated. It requests what it needs from main process via IPC channels exposed in preload. Render process code also cannot  `require` NPM packages.

## Build

### Scripts

* `npm run pack` - Builds just the executable, for just the local OS/architecture. Does not create installers, etc. Uses `--dir` electron-builder setting ([docs](https://www.electron.build/cli)). Useful for quickly testing.
* `npm run release` - Builds both the executable for the local OS/architecture, and distributable installers.

These commands bundle electron (the version specified in package.json `devDependencies`), `app`, `assets`, and any of our dependency npm packages into the target executables and/or distributable installers (e.g. dmg) in `dist`. 

We use [electron-builder](https://www.electron.build). Configure in `electron-builder.yml` and `package.json`. 

NPM package dependencies are copied by `"postinstall": "electron-builder install-app-deps"` script in package.json. It runs automatically after `electron-builder` commands. It should also ensure that our dependencies match our electron version.