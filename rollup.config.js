import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default [
  
  // Electron | Main
  {
    input: 'src/main.js',
    output: {
      sourcemap: 'true',
      format: 'cjs',
      file: 'app/main.js',
    },
    external: ['electron', 'path', 'fs-extra', 'chokidar'],
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
    plugins: [resolve(), commonjs()],
    external: [],
  }
]