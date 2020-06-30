<script>
  import * as editor from '../editor/editor.js'
  import {onMount} from 'svelte'

  export let focused;
  export let visible;
  export let state = {}

  let textarea
 
  onMount(() => {
    editor.setup(textarea, state)
  })  

</script>

<style type="text/scss">
  @import "../../../styles/_variables.scss";

  #editor {
    width: 100%;
    height: 100%;
    background-color: white;
    display: none;
    justify-content: center;

    &.focused {
      // background-color: red;
    }

    &.visible {
      display: flex
    }
  }

  #bracketsWidget {
    background: pink;
    padding: 0 0.5em;
    position: absolute;
    z-index: 10;
  }
</style>

<div id="editor" class:focused class:visible on:click>
  <textarea bind:this={textarea} style="display: none;">Gambier</textarea>
</div>
