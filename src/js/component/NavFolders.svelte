<script>
  /**
   * Render project directory contents as tree of folders.
   * Folder component does most of the work here.
   */
  import Folder from "./Folder.svelte";
  import { onMount } from "svelte";
  import { createTreeHierarchy } from "hierarchy-js";

  let isEmpty = true;
  let rootDir = {};

  function update(state) {
    // If state.contents are empty, return
    if (state.contents.length == 0) {
      isEmpty = true;
      rootDir = {};
      return;
    }

    // Filter to only directories
    const flatArrayOfDirectories = state.contents.filter(
      c => c.type == "directory"
    );

    // Convert to tree
    const tree = createTreeHierarchy(flatArrayOfDirectories);

    // From tree, set variables
    isEmpty = false;
    rootDir = tree[0];
  }

  window.api.receive("stateChanged", state => {
    update(state);
  });

  onMount(async () => {
    const state = await window.api.invoke("getState");
    update(state);
  });
</script>

<style type="text/scss">
  #folders {
    height: 100%;
    overflow-y: scroll;
    grid-column: folders;
    background: var(--clr-gray-lightest);
    padding: var(--grid-half) 0;
  }

  h1 {
    font-size: 0.7em;
    color: rgba(0, 0, 0, 0.5);
    font-weight: normal;
    margin: 0;
    padding: 0 1em;
  }
</style>

<div id="folders">
  <h1>Folders</h1>
  {#if !isEmpty}
    <Folder details={rootDir} nestedDepth={0} />
  {/if}
</div>
