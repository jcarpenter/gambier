import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import svelte from 'rollup-plugin-svelte'
import cssOnly from 'rollup-plugin-css-only'
import sveltePreprocess from 'svelte-preprocess'

// const isMac = process.platform === 'darwin'
// const isWin = process.platform === 'win32'
const production = !process.env.ROLLUP_WATCH

export default [

  /* -------------------------------------------------------------------------- */
  /*                                Main process                                */
  /* -------------------------------------------------------------------------- */
  // main.js is the app's entry point, and runs in the main process.
  {
    input: 'src/js/main/main.js',
    output: {
      sourcemap: !production,
      format: 'cjs',
      file: 'app/main.js',
    },
    external: ['electron', 'electron-store', 'path', 'fs-extra', 'chokidar', 'gray-matter', 'colors', 'deep-eql', 'remove-markdown', 'xml-js', 'immer', 'image-size', 'debounce', 'better-sqlite3', 'mime-types'],
    // plugins: [json()]
  },

  /* -------------------------------------------------------------------------- */
  /*                               Preload script                               */
  /* -------------------------------------------------------------------------- */
  // preload.js runs in each browser window (render process) before web content
  // begins loading. It enables render process scripts to communicate access Node.js 
  // APIs by communicating with main process. For security reasons, render process 
  // scripts cannot access Node.js APIs directly.
  {
    input: 'src/js/preload/preload.js',
    output: {
      sourcemap: false,
      format: 'cjs',
      file: 'app/preload.js',
    },
    external: ['electron'],
  },

  /* -------------------------------------------------------------------------- */
  /*                         Render process: App windows                        */
  /* -------------------------------------------------------------------------- */
  {
    input: 'src/js/render/app.js',
    plugins: [
      svelte({
        // Svelte preprocessors allow us to (among other things) use SCSS, Typescript (etc) in our components. `svelte-preprocess` is "a Svelte preprocessor with sensible defaults for SCSS, Less, Typescript, etc." It includes out-of-the-box support for SCSS. We can create our Svelte processors, but using one off the shelf saves us the hassle. If we declare styles in our components with `<style lang="scss">`, it will process them as SCSS.
        // svelte-preprocess (plugin) docs: https://github.com/sveltejs/svelte-preprocess 
        // Preprocessor docs: https://svelte.dev/docs#compile-time-svelte-preprocess
        preprocess: sveltePreprocess(
          {
            scss: {
              // Prepend our mixins, since we use them everywhere. This saves us having to manually include them in each component's styles. — https://github.com/sveltejs/svelte-preprocess/blob/main/docs/getting-started.md
              prependData: '@use "src/styles/_helpers" as *;'
            }
          }
        ),
        // Set Svelte compiler options:
        // Docs: https://svelte.dev/docs#compile-time-svelte-compile
        compilerOptions: {
          // "If true, Svelte generate sourcemaps for components. Use an object with js or css for more granular control of sourcemap generation. By default, this is true."
          enableSourcemap: !production,
          // "If true, causes extra code to be added to components that will perform runtime checks and provide debugging information during development."
          dev: !production,
        },
      }),
      // Extract Svelte component CSS into a separate file. This is allegeldy better for performance, and also required by rollup-plugin-svelte as of v7.
      // Per the docs: https://github.com/sveltejs/rollup-plugin-svelte#extracting-css 
      // If we don't do this, the build will fail.
      cssOnly({ 
        // Filename to write all styles to
        output: 'styles/components.css'
      }),
      // These two plugins enable us to use external dependencies from npm.
      // Docs: https://github.com/rollup/plugins/tree/master/packages/commonjs
      resolve({ preferBuiltins: false }),
      commonjs()
    ],
    output: {
      sourcemap: production ? false : "inline",
      format: 'es',
      file: 'app/app.js',
      banner: '// WORKAROUND for immer.js esm (see https://github.com/immerjs/immer/issues/557)\nwindow.process = { env: { NODE_ENV: "production" } };',
    },
    external: [
      './third-party/citeproc/citeproc.js',
      './third-party/fuse/fuse.esm.js',
      './third-party/turndown/turndown.es.js'
    ]
  },

  /* -------------------------------------------------------------------------- */
  /*                     Render process: Preferences window                     */
  /* -------------------------------------------------------------------------- */
  {
    input: 'src/js/render/app-preferences.js',
    plugins: [
      // See comments for Renderer (above)
      svelte({
        preprocess: sveltePreprocess({
          scss: {
            prependData: `@use "src/styles/_helpers" as *;`
          }
        }),
        compilerOptions: {
          enableSourcemap: !production,
          dev: !production,
        }
      }),
      cssOnly({ 
        output: 'styles/components-preferences.css'
      }),
      resolve(),
      commonjs()
    ],
    output: {
      sourcemap: production ? false : "inline",
      format: 'es',
      file: 'app/app-preferences.js',
      banner: '// WORKAROUND for immer.js esm (see https://github.com/immerjs/immer/issues/557)\nwindow.process = { env: { NODE_ENV: "production" } };',
    },
  },
]