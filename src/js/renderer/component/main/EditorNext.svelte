<script>
  import { files } from '../../FilesManager';
  import { onMount, createEventDispatcher } from 'svelte'
  import * as Editor from '../../editor2/editor';

  export let docId = undefined
  export let focused = false // 1/18: Not using these yet
  export let visible = false

  let el // This element

  $: doc = $files.byId[docId]
  $: docId, Editor.loadDoc(doc) // When `docId` changes, load doc

  onMount(async () => {
    const text = docId ? await window.api.invoke('getFileByPath', doc?.path) : ''
    Editor.init(text, el)
  })

  function forwardClick() {
    // TODO
  }

</script>

<style type="text/scss">
  .editor {
    width: 100%;
    height: 100%;
    position: relative;
    // overflow: hidden;
  }

  // Docs: https://codemirror.net/doc/manual.html#styling

  // ".CodeMirror: The outer element of the editor. This should be used for the editor width, height, borders and positioning. Can also be used to set styles that should hold for everything inside the editor (such as font and font size), or to set a background. Setting this class' height style to auto will make the editor resize to fit its content (it is recommended to also set the viewportMargin option to Infinity when doing this."
  // .CodeMirror {
  //     width: 100%;
  //     height: 100%;
  //     overflow: hidden;
  //     font-family: -apple-system, "BlinkMacSystemFont", sans-serif;
  //     font-size: var(--font-sml-1); // TODO: Replace these
  //     line-height: var(--baseLineHeight);

  //     // "The visible lines. This is where you specify vertical padding for the editor content."
  //     .CodeMirror-lines {
  //         // We want the white space on the left and right of each line to be a selectable.
  //         // thereby increasing the hit target for selections. Hence the large margin.
  //         // The margin `auto` width value also automatically centers the content.
  //         margin: var(--grid) auto;
  //         min-width: 30em;
  //         max-width: 48em;

  //         // Add padding to bottom of doc, so that when we're at bottom of
  //         // scroll, there's padding before edge of editor.
  //         padding: 0 3em 18em;
  //     }
  // }

</style>

<div
  bind:this={el}
  class="editor"
  class:focused
  class:visible
  on:click={forwardClick}
>
  <!-- <Wizard bind:this={wizard} {editorState} />
  <Autocomplete bind:this={autocomplete} />
  <Preview bind:this={preview} {editorState} /> -->
</div>
