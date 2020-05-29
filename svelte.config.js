const sveltePreprocess = require('svelte-preprocess')

// This file exists to enable SASS syntax highlighting in VSCode.
// Per: https://daveceddia.com/svelte-with-sass-in-vscode/ 

module.exports = {
    preprocess: sveltePreprocess(),
    // ...other svelte options
}