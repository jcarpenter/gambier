<script>
  import SideBarItem from "./SideBarItem.svelte";
  import SideBarFolders from "./SideBarFolders.svelte";
  import { onMount } from "svelte";

  export let state = {};
  export let focused;

  // $: shortcuts = [
  //   {
  //     label: "All",
  //     id: "all",
  //     showFilesList: true,
  //     filesSearchCriteria: {
  //       lookInFolderId: state.rootFolderId,
  //       includeChildren: true
  //     }
  //   },
  //   {
  //     label: "Most Recent",
  //     id: "most-recent",
  //     showFilesList: true,
  //     filesSearchCriteria: {
  //       lookInFolderId: state.rootFolderId,
  //       includeChildren: true,
  //       filterDateModified: true,
  //       fromDateModified: new Date().toISOString(),
  //       toDateModified: new Date(
  //         Date.now() - 7 * 24 * 60 * 60 * 1000
  //       ).toISOString()
  //     }
  //   },
  //   {
  //     label: "Favorites",
  //     id: "favorites",
  //     showFilesList: true,
  //     filesSearchCriteria: {
  //       lookInFolderId: state.rootFolderId,
  //       includeChildren: true,
  //       tags: ["favorite"]
  //     }
  //   }
  // ];

  onMount(() => {
    if (state.sideBar.selectedItemId == '') {
      window.api.send("dispatch", {
        type: "SELECT_SIDEBAR_ITEM",
        id: "all"
      });
    }
  });
</script>

<style type="text/scss">
  @import "../../styles/_variables.scss";

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
  {#each state.sideBar.items as group}
    <h1 class="title">{group.label}</h1>
    {#each group.children as item}
      <SideBarItem
        label={item.label}
        id={item.id}
        selected={item.id == state.sideBar.selectedItemId} />
    {/each}
  {/each}

  <!-- {#each shortcuts as item}
    <SideBarItem
      {state}
      {...item}
      selected={state.sideBar.selectedItemId == item.id} />
  {/each}

  <SideBarFolders {state} />

  <h1 class="title">Citations</h1>
  <SideBarItem
    {state}
    label={'All'}
    id="all-citations"
    selected={state.sideBar.selectedItemId == 'all-citations'}
    showFilesList={false} /> -->
</div>
