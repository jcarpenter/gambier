<script>
  import { onMount, createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function forward() {
    dispatch('clicked', {target: event.target, id: id});
  }

  export let id;
  export let title;
  export let excerpt;
  export let selected;
  
  export let parentSectionFocused = false;

</script>

<style type='text/scss'>
  .file {
    padding: 0.5em 0.5em 0;
    cursor: default;

    &:focus {
      outline: none;
    }
  }

  h2,
  p {
    font-size: 0.8em;
    line-height: 1.5em;
    margin: 0;
    padding: 0;
    pointer-events: none;
  }

  p {
    font-size: 0.8em;
    color: gray;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  hr {
    margin: 0.5em 0 0;
    height: 1px;
    background-color: rgba(0, 0, 0, 0.2);
    border: 0;
  }

  .selected {
    background: var(--clr-gray-lightest);
    &.parentSectionFocused {
      background: rgb(45, 103, 250);
      h2 {
        color: white;
      }
      p {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }
</style>

<div class='file' on:click={forward} class:selected class:parentSectionFocused tabindex='0'>
  <h2>{title}</h2>
  <p>{excerpt}</p>
  <hr />
</div>
