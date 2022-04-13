# Gambier

A work-in-progress Markdown editor. 

<img width="1680" alt="overall-ui" src="https://user-images.githubusercontent.com/1425497/158499981-40fc3ec2-c6cc-490a-a8ef-1035af6eed6b.png">

Built with [Svelte](https://svelte.dev/) | [CodeMirror](https://codemirror.net/) | [Electron](https://www.electronjs.org/)

## Development

1. Run `npm install` to install dependencies. `electron-builder install-app-deps` will automatically run afterwards. It rebuilds dependencies for the version of Node that Electron is using, instead of the system version (which will rarely match).
1. Run `npm run dev` to bundle JS, compile SCSS, copy assets, etc. Watches for changes to `src/js` and `src/styles`. If changes are made to other `src` directories, we must re-run this script manually. 
1. Run `npm run start` to open Electron from `/node_modules/electron` and run the app. 

Electron will reload when changes are made to css or js files in `app`. This is implemented in `main.js` with [electron-reload](https://www.npmjs.com/package/electron-reload).

### Directories

* `src` - Source files.
* `app` - Run-time app files. Copied or built from `src`.
* `assets` - Support assets for our builds. Icons, marketing images, etc .
* `dist` - Packaged distributable app will be output here.
