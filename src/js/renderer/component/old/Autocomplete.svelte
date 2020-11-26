<script>
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  export let element
  export let visible = false
  export let selectedOptionIndex = 0

  export let menuItems = null

  function forwardClick(evt) {
    dispatch('click', evt)
  }
</script>

<style type="text/scss">
  // @import "../../../styles/_variables.scss";
</style>

<svelte:options accessors={true} />

<div
  class:visible
  bind:this={element}
  id="autocompleteMenu"
  tabindex="0"
  on:click={forwardClick}>
  {#if menuItems}
    <ul id="menu">
      {#each menuItems.list as { label, preview }, index}
        <li class="option" class:selected={index == menuItems.selectedIndex}>
          <span class="label">{label}</span>
          <span class="preview">{preview}</span>
        </li>
      {/each}
    </ul>
  {/if}
</div>
