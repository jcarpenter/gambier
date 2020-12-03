import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import svelte from 'rollup-plugin-svelte'
import sveltePreprocess from 'svelte-preprocess'

const production = !process.env.ROLLUP_WATCH

export default [

  // Electron | Main
  {
    input: 'src/js/main/main.js',
    output: {
      sourcemap: true,
      format: 'cjs',
      file: 'app/main.js',
    },
    external: ['electron', 'electron-store', 'path', 'fs-extra', 'chokidar', 'gray-matter', 'colors', 'deep-object-diff', 'deep-eql', 'remove-markdown', 'deep-diff', 'xml-js', 'immer', 'image-size', 'debounce', 'better-sqlite3'],
  },

  // Electron | Preload
  {
    input: 'src/js/main/preload.js',
    output: {
      sourcemap: false,
      format: 'cjs',
      file: 'app/js/preload.js',
    },
    external: ['electron'],
  },

  // Electron | Renderer
  {
    input: 'src/js/renderer/renderer.js',
    output: {
      sourcemap: true,
      format: 'es',
      file: 'app/js/renderer.js',
      banner: '// WORKAROUND for immer.js esm (see https://github.com/immerjs/immer/issues/557)\nwindow.process = { env: { NODE_ENV: "production" } };',
      // globals: {
      //   test: 'test'
      // }
    },
    plugins: [
      svelte({
        preprocess: sveltePreprocess({
          defaults: {
            style: 'scss'
          },
          scss: {
            // Prepend our mixins, since we use them everywhere. This saves us having to manually include them in each component's styles. — https://github.com/sveltejs/svelte-preprocess/blob/main/docs/getting-started.md
            prependData: `@import 'src/styles/_mixins.scss';`
          }
        }),

        // This is the default, so it's not strictly necessary to declare.
        // If `dom`, Svelte emits a JavaScript class for mounting to the DOM. If "ssr", Svelte emits an object with a render method suitable for server-side rendering. If false, no JavaScript or CSS is returned; just metadata. — https://svelte.dev/docs#svelte_compile
        generate: 'dom',

        // "If true, causes extra code to be added to components that will perform runtime checks and provide debugging information during development." — https://svelte.dev/docs#svelte_compile
        // Enable when not in production
        dev: !production,
        
        // we'll extract any component CSS out into
        // a separate file - better for performance
        // css: css => {
        //   css.write('public/build/bundle.css');
        // }
      }),
      resolve(),
      commonjs()
    ],
    external: [
      './third-party/citeproc/citeproc.js',
      './third-party/fuse/fuse.esm.js',
      './third-party/turndown/turndown.es.js'
    ]
  }
]