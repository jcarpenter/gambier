<script>
  import { onMount } from "svelte";

  export let state = {}
  export let selected = false
  export let title = ''
  export let excerpt = ''

  $: focused = state.focusedLayoutSection == 'navigation'

</script>

<style type="text/scss">
  @import "../../styles/_variables.scss";

  .file {
    padding: 0.5em 1em 0.5em;
    overflow-y: hidden;
    border-bottom: 1px solid gray;
    contain: content;

    &:focus {
      outline: none;
    }
  }

  h2,
  p {
    margin: 0;
    padding: 0;
    pointer-events: none;
    word-break: break-word;
  }

  h2 {
    @include column;
  }

  p {
    @include column;
    color: gray;
    height: 4em;
    // display: -webkit-box;
    // -webkit-line-clamp: 3;
    // -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .selected {
    background-color: var(--clr-gray-lightest);
  }

  .focused.selected {
    background-color: rgb(45, 103, 250);
    h2 {
      color: white;
    }
    p {
      color: rgba(255, 255, 255, 0.8);
    }
  }

</style>

<div class="file"
    class:focused
    class:selected
    on:click|preventDefault
    tabindex="0">
    <h2>{title}</h2>
    <p>{excerpt}</p>
    <!-- <hr /> -->
</div>