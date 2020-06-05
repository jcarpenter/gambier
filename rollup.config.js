import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import svelte from 'rollup-plugin-svelte'
import autoPreprocess from 'svelte-preprocess'

export default [
  
  // Electron | Main
  {
    input: 'src/main.js',
    output: {
      sourcemap: 'true',
      format: 'cjs',
      file: 'app/main.js',
    },
    external: ['electron', 'electron-store', 'path', 'fs-extra', 'chokidar', 'gray-matter', 'colors', 'deep-object-diff', 'deep-eql', 'remove-markdown'],
  },

  // Electron | Preload
  {
    input: 'src/js/preload.js',
    output: {
      sourcemap: 'false',
      format: 'cjs',
      file: 'app/js/preload.js',
    },
    external: ['electron'],
  },

  // Electron | Renderer
  {
    input: 'src/js/renderer.js',
    output: {
      sourcemap: 'true',
      format: 'es',
      file: 'app/js/renderer.js',
    },
    plugins: [
      svelte({
        preprocess: autoPreprocess(),
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
    external: [],
  }
]