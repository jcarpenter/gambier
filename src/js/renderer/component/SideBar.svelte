<script>
  import { createTreeHierarchy } from "hierarchy-js";
  import SideBarItem from "./SideBarItem.svelte";
  import SideBarFolders from "./SideBarFolders.svelte";
  import { onMount } from "svelte";

  export let state = {};
  export let focused;
  
  let tree = {}

  $: {
    if (
      state.changed.includes("sideBar") ||
      state.changed.includes("folders")
    ) {
      buildTree()
    }
  }

  onMount(() => {
    buildTree()

    if (state.selectedSideBarItemId == '') {
      window.api.send("dispatch", {
        type: "SELECT_SIDEBAR_ITEM",
        id: "all"
      });
    }
  });

  function buildTree() {
    tree = createTreeHierarchy(state.sideBar.items);
  }


</script>

<style type="text/scss">
  @import "../../../styles/_variables.scss";

  #sidebar {
    width: 100%;
    height: 100%;
    background-color: lightgray;
    overflow-y: scroll;
    position: relative;
    border-right: 1px solid black;
    user-select: none;

    &.focused {
      background-color: red;
    }
  }

  .title {
    @include label-normal-small-bold;
    margin: 15px 0 0 9px;

    &:first-of-type {
      margin-top: 9px;
    }
  }
</style>

<div id="sidebar" class:focused>
  {#each tree as topLevelItem}
    {#if topLevelItem.type == 'group'}
      <h1 class="title">{topLevelItem.label}</h1>
      {#each topLevelItem.children as item}
        <SideBarItem
          state={state}
          id={item.id}
          children={item.children ? item.children : []}
          />
      {/each}
    {/if}
  {/each}
</div>
