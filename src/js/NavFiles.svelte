<script>
  import File from "./File.svelte";
  import { onMount } from "svelte";

  let files = []

  function update(state) {
    // Get files for active folder

    files = state.contents.filter(obj => {
      return (obj.parentId === state.selectedFolderId && obj.type == 'file');
    })

    console.log(files)
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

</style>

{#each files as file}
  <File details={file}/>
{/each}