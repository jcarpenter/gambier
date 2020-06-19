<script>
  /**
   * Render project directory contents as tree of folders.
   * Folder component does most of the work here.
   */
  import { onMount } from "svelte";
  import { createTreeHierarchy } from "hierarchy-js";
  import SideBarItem from "./SideBarItem.svelte";

  export let state = {};

  let rootFolder = {};

  $: {
    if (state.changed.includes("contents")) {
      buildTree()
    }
  }

  onMount(() => {
    buildTree()
  })

  function buildTree() {
    if (state.contents.length == 0) return

  // Filter to only directories
    const flatArrayOfFolders = state.contents.filter(
      c => c.type == "directory"
    );

    // Add `filesSearchCriteria` for each
    flatArrayOfFolders.map(f => {
      f.filesSearchCriteria = {
        lookInFolderId: f.id,
        includeChildren: false
      };
    });

    // Convert to tree
    const tree = createTreeHierarchy(flatArrayOfFolders);

    // From tree, set rootFolder
    rootFolder = tree[0];
  }

</script>

<style type="text/scss">

</style>

<SideBarItem
  state={state}
  label={rootFolder.name}
  id={rootFolder.id}
  children={rootFolder.children ? rootFolder.children : []}
  filesSearchCriteria={rootFolder.filesSearchCriteria}
  selected={state.sideBar.selectedItemId == rootFolder.id}
  icon={'images/folder.svg'}
  showFilesList={true}
  expanded />
