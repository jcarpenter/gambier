import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import svelte from 'rollup-plugin-svelte'
import sveltePreprocess from 'svelte-preprocess'
// import json from '@rollup/plugin-json';

const production = !process.env.ROLLUP_WATCH
const isMac = process.platform === 'darwin'
const isWin = process.platform === 'win32'

export default [

  // Main
  {
    input: 'src/js/main/main.js',
    output: {
      sourcemap: true,
      format: 'cjs',
      file: 'app/main.js',
    },
    external: ['electron', 'electron-store', 'path', 'fs-extra', 'chokidar', 'gray-matter', 'colors', 'deep-object-diff', 'deep-eql', 'remove-markdown', 'deep-diff', 'xml-js', 'immer', 'image-size', 'debounce', 'better-sqlite3', 'mime-types'],
    // plugins: [json()]
  },

  // Preload
  {
    input: 'src/js/main/preload.js',
    output: {
      sourcemap: false,
      format: 'cjs',
      file: 'app/js/preload.js',
    },
    external: ['electron'],
  },

  // Renderer
  {
    input: 'src/js/renderer/renderer.js',
    plugins: [
      svelte({
        // Preprocess components with svelte.preprocess
        // Docs: https://svelte.dev/docs#compile-time-svelte-preprocess
        preprocess: sveltePreprocess({
          style: {
            // Prepend our mixins, since we use them everywhere. This saves us having to manually include them in each component's styles. — https://github.com/sveltejs/svelte-preprocess/blob/main/docs/getting-started.md
            prependData: `@use "src/styles/_helpers" as *;`
          }
        }),
        // Set Svelte compiler options:
        // Docs: https://svelte.dev/docs#svelte_compile
        compilerOptions: {
          // "If true, causes extra code to be added to components that will perform runtime checks and provide debugging information during development." — https://svelte.dev/docs#svelte_compile
          dev: !production,
        }
      }),
      resolve(),
      commonjs()
    ],
    output: {
      sourcemap: !production,
      format: 'es',
      file: 'app/js/renderer.js',
      banner: '// WORKAROUND for immer.js esm (see https://github.com/immerjs/immer/issues/557)\nwindow.process = { env: { NODE_ENV: "production" } };',
    },
    external: [
      './third-party/citeproc/citeproc.js',
      './third-party/fuse/fuse.esm.js',
      './third-party/turndown/turndown.es.js'
    ]
  },

  // Preferences
  {
    input: 'src/js/renderer/preferences.js',
    output: {
      sourcemap: !production,
      format: 'es',
      file: 'app/js/preferences.js',
      banner: '// WORKAROUND for immer.js esm (see https://github.com/immerjs/immer/issues/557)\nwindow.process = { env: { NODE_ENV: "production" } };',
    },
    plugins: [
      // Same comments as for Renderer (see above)
      svelte({
        preprocess: sveltePreprocess({
          style: {
            prependData: `@use "src/styles/_helpers" as *;`
          }
        }),
        compilerOptions: {
          dev: !production,
        }
      }),
      resolve(),
      commonjs()
    ]
  },
]