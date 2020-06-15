<script>
  /**
   * Render files in a folder as a vertical list
   */
  import { onMount, tick } from "svelte";
  import { hasChanged } from "../utils";

  let files = [];
  let selectedDirectoryId = 0;
  let selectedFileIndex = 0;
  let selectedEl = 0;
  let section;
  let sectionIsFocused = false;

  function handleKeydown(event) {
    if (!sectionIsFocused) return;
    const key = event.key;
    switch (key) {
      case "Tab":
        event.preventDefault();
        break;
      case "ArrowUp":
        event.preventDefault();
        if (selectedFileIndex > 0) {
          const prevFileId = files[selectedFileIndex - 1].id;
          window.api.send("dispatch", { type: "OPEN_FILE", id: prevFileId });
        }
        break;
      case "ArrowDown":
        event.preventDefault();
        if (selectedFileIndex < files.length - 1) {
          const nextFileId = files[selectedFileIndex + 1].id;
          window.api.send("dispatch", { type: "OPEN_FILE", id: nextFileId });
        }
        break;
    }
  }

  /**
   * Rebuild files array, for new selected folder
   * Filter to files with matching parentId, and type 'file'
   */
  function populateFiles(state) {
    files = state.contents.filter((obj, index) => {
      return obj.type == "file" && obj.parentId == selectedDirectoryId;
    });
  }

  /**
   * Set `selected` property of each entry in files array.
   * Set all to false, except the one whose id == state.lastOpenedFileId.
   * Then make sure the selected file is scrolled into view.
   */
  async function setSelectedFile(state) {
    // Get selectedFileId for selectedFolder
    let selectedFileId = state.contents.find(
      d => d.type == "directory" && d.id == state.selectedFolderId
    ).selectedFileId;

    // If it's 0 (the default, meaning "nothing"), set selectFileId to first of files
    if (selectedFileId == 0) {
      selectedFileId = files[0].id;
    }

    // Find the file whose id == selectedFileId, 
    // and set selected true, and `selectedFileIndex = index`
    // Set all other files unselected
    files.forEach((f, index) => {
      f.selected = f.id == selectedFileId;
      if (f.selected) selectedFileIndex = index;
    });

    // Tell Svelte that variable has changed. Makes view update.
    files = files;
  }

  function scrollFileIntoView(element, animate = true) {
    const behavior = animate ? "smooth" : "auto";
    if (element) {
      element.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: behavior
      });
    }
  }

  onMount(async () => {
    const state = await window.api.invoke("getState");
    selectedDirectoryId = state.selectedFolderId;
    populateFiles(state);
    setSelectedFile(state);
    await tick();
    scrollFileIntoView(selectedEl, false);
  });

  window.api.receive("stateChanged", async (state, oldState) => {
    console.log("NAVFILES: STATE CHANGED");

    // If selected folder changed...
    if (hasChanged("selectedFolderId", state, oldState)) {
      selectedDirectoryId = state.selectedFolderId;
      populateFiles(state);
      setSelectedFile(state);
      await tick();
      scrollFileIntoView(selectedEl, true);
    }

    // If selected file id changed...
    if (hasChanged("lastOpenedFileId", state, oldState)) {
      setSelectedFile(state);
      await tick();
      scrollFileIntoView(selectedEl, true);
    }
  });

  function clicked(id) {
    window.api.send("dispatch", {
      type: "OPEN_FILE",
      parentId: selectedDirectoryId,
      fileId: id
    });
  }
</script>

<style type="text/scss">
  @import "../../styles/_variables.scss";

  #files {
    height: 100%;
    overflow-y: scroll;
    grid-column: files;
    background-color: white;
    border-left: 1px solid lightgray;
    border-right: 1px solid lightgray;
    padding: 0;
    // overscroll-behavior-y: contain;
  }

  .file {
    padding: 0.5em 1em 0;
    cursor: default;

    &:focus {
      outline: none;
    }
  }

  h2,
  p {
    font-size: 0.8em;
    line-height: 1.5em;
    margin: 0;
    padding: 0;
    pointer-events: none;
  }

  p {
    font-size: 0.8em;
    color: gray;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  hr {
    margin: 0.5em 0 0;
    height: 1px;
    background-color: rgba(0, 0, 0, 0.2);
    border: 0;
  }

  .selected {
    background: var(--clr-gray-lightest);
    &.parentSectionFocused {
      background: rgb(45, 103, 250);
      h2 {
        color: white;
      }
      p {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }
</style>

<svelte:window
  on:click={e => (sectionIsFocused = section.contains(e.target))}
  on:keydown={handleKeydown} />

<section data-elastic bind:this={section} id="files">
  {#each files as file}
    {#if file.selected}
      <div
        bind:this={selectedEl}
        class="file selected"
        class:parentSectionFocused={sectionIsFocused}
        tabindex="0">
        <h2>{file.title}</h2>
        <p>{file.excerpt}</p>
        <hr />
      </div>
    {:else}
      <div
        class="file"
        on:click|preventDefault={() => clicked(file.id)}
        class:parentSectionFocused={sectionIsFocused}
        tabindex="0">
        <h2>{file.title}</h2>
        <p>{file.excerpt}</p>
        <hr />
      </div>
    {/if}
  {/each}
</section>
