<script>
  import File from "./File.svelte";
  import { onMount } from "svelte";

  let files = [];
  let selectedFileId = 0;
  let selectedFileIndex = 0;
  let key;

  function handleKeydown(event) {
    key = event.key;
    switch (key) {
      case "ArrowUp":
        // console.log("ArrowUp");
        window.api.send("dispatch", { type: "OPEN_FILE", id: prevFileId });
        break;
      case "ArrowDown":
        // console.log("ArrowDown");
        window.api.send("dispatch", { type: "OPEN_FILE", id: nextFileId });
        break;
    }
  }

  function update(state) {
    // On folder change
    // Get files for selected folder
    files = state.contents.filter((obj, index) => {
      return obj.parentId === state.selectedFolderId && obj.type == "file";
    });

    // selectedFileId = state.lastOpenedFileId;

    // On selected file chngaee
    selectedFileId = state.lastOpenedFileId;
    selectedFileIndex = files.findIndex(f => f.id == selectedFileId);
    prevFileId =
      selectedFileIndex > 0 ? files[selectedFileIndex - 1].id : selectedFileId;
    nextFileId =
      selectedFileIndex < files.length - 1
        ? files[selectedFileIndex + 1].id
        : selectedFileId;
  }

  window.api.receive("stateChanged", (state, oldState) =>
    update(state, oldState)
  );

  onMount(async () => {
    const state = await window.api.invoke("getState");
    update(state);
  });
</script>

<style type="text/scss">

</style>

<svelte:window on:keydown|preventDefault={handleKeydown} />

{#each files as { title, excerpt, id }}
  <File
    {title}
    {excerpt}
    {id}
    selected={selectedFileId == id ? true : undefined} />
{/each}
