<script>
  import { onMount } from "svelte";

  export let state = {};
  export let id;
  export let children = []
  export let nestDepth = 0;
  
  let selected = false;

  let sideBarItem

  $: sideBarItem = state.sideBar.items.find((i) => i.id == id)
  $: expandable = children.length > 0
  $: expanded = sideBarItem.expanded
  $: selected = state.sideBar.selectedItemId == sideBarItem.id

  function clicked() {
    if (selected) return;

    window.api.send("dispatch", {
      type: "SELECT_SIDEBAR_ITEM",
      id: id,
    });
  }

  function toggleExpanded() {
    window.api.send("dispatch", {
      type: "TOGGLE_SIDEBAR_ITEM_EXPANDED",
      id: sideBarItem.id,
    });
  }
</script>

<style type="text/scss">
  @import "../../styles/_variables.scss";

  #container {
    overflow: hidden;
    position: relative;
  }

  #flex-row {
    margin-top: 2px;
    height: 24px;
    display: flex;
    align-items: center;
  }

  .selected > #flex-row {
    background-color: rgba(0, 0, 0, 0.1);
  }

  #disclosure-triangle {
    @include unstyled-button;
    margin-left: 4px;
    width: 13px;
    height: 13px;
    background-color: transparent;

    img {
      width: 100%;
      height: 100%;
      display: none;
    }

    &.expandable img {
      display: inline;
    }

    &.expanded img {
      transform: rotate(90deg);
    }
  }

  [data-nestDepth="1"] #disclosure-triangle {
    margin-left: calc(4px + calc(16px * 1));
  }

  [data-nestDepth="2"] #disclosure-triangle {
    margin-left: calc(4px + calc(16px * 2));
  }

  [data-nestDepth="3"] #disclosure-triangle {
    margin-left: calc(4px + calc(16px * 3));
  }

  #icon {
    margin-left: 4px;
    width: 18px;
    height: 18px;
  }

  #label {
    @include label-normal;
    margin-left: 6px;
    flex: 1;
  }

  // Children
  #children {
    height: 0;
    
    &.expanded {
      height: auto;
    }
  }
</style>

<div id="container" class:selected data-nestDepth={nestDepth}>
  <div id="flex-row" on:click={clicked}>
    <button
      class:expandable
      class:expanded
      id="disclosure-triangle"
      alt="Expand"
      on:click|stopPropagation={toggleExpanded}>
      <img src="images/mac/disclosure-triangle.svg" alt="Collapse/Expand" />
    </button>
    <img src={sideBarItem.icon} id="icon" alt="Icon" />
    <span id="label">{sideBarItem.label}</span>
  </div>

  <!-- Recursive children nesting -->
  {#if children.length > 0}
    <div id="children" class:expanded>
      {#each children as item}
        <svelte:self
          state={state}
          id={item.id}
          children={item.children ? item.children : []}
          nestDepth={nestDepth + 1} />
      {/each}
    </div>
  {/if}
</div>
