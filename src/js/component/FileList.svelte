<script>
  /**
   * Render files in a folder as a vertical list
   */
  import { onMount, tick } from "svelte";

  export let state = {};
  export let focused;

  let files = [];
  let sortKey = "title";
  let sortOrder = "ascending";

  let selectedFileIndex = 0;
  let selectedEl = undefined;

  $: {
    if (
      state.changed.includes("contents") ||
      state.changed.includes("filesSearchCriteria") ||
      state.changed.includes("selectedFileId")
    ) {
      files = getFiles();
      sortFiles();
    }
  }

  onMount(async () => {
    files = getFiles();
    sortFiles();
  });

  function getChildFolderIds(parentFolder) {
    let ids = [];

    const children = state.contents.map(c => {
      if (c.type == "directory" && c.parentId == parentFolder.id) {
        // Push id of child folder
        ids.push(c.id);

        // Find and push ids of the child's children (recursive)
        getChildFolderIds(c).map(m => {
          ids.push(m);
        });
      }
    });

    return ids;
  }

  function getFiles() {
    if (
      state.projectPath == "" ||
      !state.contents.length > 0 ||
      !state.filesSearchCriteria
    )
      return [];

    let files = [];

    const folderId = state.filesSearchCriteria.lookInFolderId;
    const includeChildren = state.filesSearchCriteria.includeChildren;
    const tags = state.filesSearchCriteria.tags;
    const filterDateModified = state.filesSearchCriteria.filterDateModified;
    const filterDateCreated = state.filesSearchCriteria.filterDateCreated;

    // Get selected folder
    const folder = state.contents.find(
      c => c.type == "directory" && c.id == folderId
    );

    // Get all files for selected folder
    files = state.contents.filter(
      c => c.type == "file" && c.parentId == folderId
    );

    // If `includeChildren`, add files of child folders
    if (includeChildren) {
      // Get ids of child folders
      let childFolderIds = getChildFolderIds(folder);

      // Add files in child folders
      state.contents.map(c => {
        if (c.type == "file") {
          if (childFolderIds.includes(c.parentId)) {
            files.push(c);
          }
        }
      });
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      files = files.filter(f => {
        return tags.some(t => {
          if (f.tags.includes(t)) {
            return true;
          }
        });
      });
    }

    // Filter by date modified
    if (filterDateModified) {
      const from = new Date(state.filesSearchCriteria.fromDateModified);
      const to = new Date(state.filesSearchCriteria.toDateModified);
      files = files.filter(f => {
        const modified = new Date(f.modified);
        if (modified < from && modified > to) {
          return f;
        }
      });
    }

    // Filter by date modified
    if (filterDateCreated) {
      const from = new Date(state.filesSearchCriteria.fromDateCreated);
      const to = new Date(state.filesSearchCriteria.toDateCreated);
      files = files.filter(f => {
        const created = new Date(f.created);
        if (created < from && created > to) {
          return f;
        }
      });
    }

    return files;
  }

  function sortFiles() {
    if (!files) return;

    if (sortKey == "title") {
      if (sortOrder == "ascending") {
        files.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortOrder == "descending") {
        files.sort((a, b) => b.title.localeCompare(a.title));
      }
    }
  }

  /**
   * Set `selected` property of each entry in files array.
   * Set all to false, except the one whose id == state.lastOpenedFileId.
   * Then make sure the selected file is scrolled into view.
   */
  async function setSelectedFile(state) {
    if (files.length == 0) return;

    // Get selectedFileId for selectedFolder
    let selectedFileId = state.contents.find(
      d => d.type == "directory" && d.id == state.selectedFolderId
    ).selectedFileId;

    // If it's 0 (the default, meaning "nothing"), set selectFileId to first of files
    if (selectedFileId == "") {
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

    // Await tick, then scroll file into view
    await tick();
    scrollFileIntoView(selectedEl, true);
  }

  /**
   * User can press arrow keys to navigate up/down the list
   * TODO: SideBar + FileList should be one unified focus area. Pressing arrows while clicking inside SideBar should translate into up/down inside FileList.
   */
  function handleKeydown(event) {
    if (!focused) return;
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

  function openFile(id) {
    window.api.send("dispatch", {
      type: "OPEN_FILE",
      // parentId: selectedFolderId,
      fileId: id
    });
  }
</script>

<style type="text/scss">
  @import "../../styles/_variables.scss";

  #files {
    width: 100%;
    height: 100%;
    background-color: white;
    overflow-y: scroll;
    border-right: 1px solid black;
    padding: 0;
    user-select: none;
  }

  .file {
    padding: 0.5em 1em 0;

    &:focus {
      outline: none;
    }
  }

  h2,
  p {
    margin: 0;
    padding: 0;
    pointer-events: none;
    word-break: break-word;
  }

  h2 {
    @include column;
  }

  p {
    @include column;

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
  }

  .focused .selected {
    background: rgb(45, 103, 250);
    h2 {
      color: white;
    }
    p {
      color: rgba(255, 255, 255, 0.8);
    }
  }
</style>

<svelte:window on:keydown={handleKeydown} />

<div id="files" class:focused>
  {#each files as file}
    {#if file.selected}
      <div bind:this={selectedEl} class="file selected" tabindex="0">
        <h2>{file.title}</h2>
        <p>{file.excerpt}</p>
        <hr />
      </div>
    {:else}
      <div
        class="file"
        on:click|preventDefault={() => openFile(file.id)}
        tabindex="0">
        <h2>{file.title}</h2>
        <p>{file.excerpt}</p>
        <hr />
      </div>
    {/if}
  {/each}
</div>
