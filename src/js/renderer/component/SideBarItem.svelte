<script>
  import { onMount } from "svelte";

  export let state = {};
  export let item = {}
  export let nestDepth = 0;

  let selected = false;

  $: selected = state.selectedSideBarItem.id == item.id

  function clicked() {
    if (selected) return;

    window.api.send("dispatch", {
      type: "SELECT_SIDEBAR_ITEM",
      item: item,
    });
  }

  function toggleExpanded() {
    window.api.send("dispatch", {
      type: "TOGGLE_SIDEBAR_ITEM_EXPANDED",
      item: item,
    });
  }
</script>

<style type="text/scss">
</style>

<div class="sideBarItem" class:selected data-nestDepth={nestDepth}>
  <div id="flex-row" on:click={clicked}>
    <button
      class:expandable={item.children.length > 0}
      class:expanded={item.expanded}
      id="disclosure-triangle"
      alt="Expand"
      on:click|stopPropagation={toggleExpanded}>
      <img src="images/mac/disclosure-triangle.svg" alt="Collapse/Expand" />
    </button>
    <img src={item.icon} id="icon" alt="Icon" />
    <span id="label">{item.label}</span>
  </div>

  {#if item.children.length > 0}
    <div id="children" class:expanded={item.expanded}>
      {#each item.children as childItem}
        <svelte:self
          state={state}
          item={childItem}
          nestDepth={nestDepth + 1} />
      {/each}
    </div>
  {/if}
</div>