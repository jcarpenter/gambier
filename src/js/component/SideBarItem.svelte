<script>
  import { onMount } from "svelte";

  export let state = {};
  export let label = "Label";
  export let id;
  export let children = [];
  export let showFilesList = false;
  export let filesSearchCriteria = undefined;
  export let icon = "images/sidebar-default-icon.svg";
  export let selected = false;
  export let expanded;
  export let nestDepth = 0;

  $: expandable = children.length > 0;

  function clicked() {
    if (selected) return;

    const action = {
      type: "SELECT_SIDEBAR_ITEM",
      id: id,
    };
    
    window.api.send("dispatch", action);
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

  .expandable #disclosure-triangle img {
    display: inline;
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
</style>

<div id="container" class:expandable class:selected data-nestDepth={nestDepth}>
  <div id="flex-row" on:click={clicked}>
    <button
      id="disclosure-triangle"
      alt="Expand"
      class:expanded
      on:click|stopPropagation={() => (expanded = !expanded)}>
      <img src="images/mac/disclosure-triangle.svg" alt="Collapse/Expand" />
    </button>
    <img src={icon} id="icon" alt="Icon" />
    <span id="label">{label}</span>
  </div>

  <!-- Recursive children nesting -->
  {#if children.length > 0}
    {#each children as item}
      <svelte:self
        state={state}
        label={item.name}
        id={item.id}
        selected={state.sideBar.selectedItemId == item.id}
        children={item.children ? item.children : []}
        icon={'images/folder.svg'}
        filesSearchCriteria={item.filesSearchCriteria}
        showFilesList={true}
        nestDepth={nestDepth + 1}
        expanded />
    {/each}
  {/if}
</div>
