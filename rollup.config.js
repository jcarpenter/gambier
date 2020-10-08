import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import svelte from 'rollup-plugin-svelte'
import sveltePreprocess from 'svelte-preprocess'

export default [
  
  // Electron | Main
  {
    input: 'src/js/main/main.js',
    output: {
      sourcemap: true,
      format: 'cjs',
      file: 'app/main.js',
    },
    external: ['electron', 'electron-store', 'path', 'fs-extra', 'chokidar', 'gray-matter', 'colors', 'deep-object-diff', 'deep-eql', 'remove-markdown', 'deep-diff'],
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
      // globals: {
      //   test: 'test'
      // }
    },
    plugins: [
      svelte({
        preprocess: sveltePreprocess(),
        generate: 'dom'
        // enable run-time checks when not in production
        // dev: !production,
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
      '../third-party/turndown/turndown.es.js'
    ]
  }
]