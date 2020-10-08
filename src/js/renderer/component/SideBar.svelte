<script>
  import { createTreeHierarchy } from "hierarchy-js";
  import { onMount } from "svelte";
  import { getSideBarItemById, isEmpty } from "../utils";
  import SideBarItem from "./SideBarItem.svelte";

  export let state = {};
  export let focused;

  $: sideBarItem = getSideBarItemById(state, state.selectedSideBarItem.id);
  $: folders = createTreeHierarchy(state.sideBar.folders)
  $: documents = createTreeHierarchy(state.sideBar.documents)
  $: media = createTreeHierarchy(state.sideBar.media)

  // $: {
  //   if (
  //     state.changed.includes("sideBar")
  //   ) {
  //     buildTree()
  //   }
  // }

  onMount(() => {
    // buildTree()

    // If no sideBar item is selected yet (ala on first run), select first folder
    if (isEmpty(state.selectedSideBarItem)) {
      window.api.send("dispatch", {
        type: "SELECT_SIDEBAR_ITEM",
        item: folders[0]
      });
    }
  });

  // function buildTree() {
  //   folders = createTreeHierarchy(state.sideBar.folders);
  //   documents = createTreeHierarchy(state.sideBar.documents);
  //   media = createTreeHierarchy(state.sideBar.media);
  // }

</script>

<style type="text/scss">
</style>

<div id="sidebar" class:focused>
  
  <h1 class="title">Folders</h1>
  {#each folders as item}
    <SideBarItem state={state} item={item} />
  {/each}
  
  <h1 class="title">Documents</h1>
  {#each documents as item}
    <SideBarItem state={state} item={item} />
  {/each}
  
  <h1 class="title">Media</h1>
  {#each media as item}
    <SideBarItem state={state} item={item} />
  {/each}

</div>
