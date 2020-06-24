<script>
  /**
   * Render files in a folder as a vertical list
   */
  import { onMount, tick } from "svelte";
  import FileListItem from "./FileListItem.svelte";

  export let state = {};
  export let oldState = {};
  export let focused;

  // Files
  let files = [];
  let fileEl
  let selectedFileIndex = 0;
  
  // Sorting
  let sortKey = "title";
  let sortOrder = "ascending";


  $: sideBarItem = state.sideBar.items.find((i) => i.id == state.sideBar.selectedItemId)
  $: focused = state.focusedLayoutSection == 'navigation'
  $: {
    if (state.changed.includes("sideBar.selectedItemId")) {
      saveOutgoingSideBarItemScrollPosition()
    }

    if (
      state.changed.includes("sideBar.selectedItemId") ||
      state.changed.includes("contents")
    ) {
      getFiles();
      sortFiles();
      restoreSideBarItemScrollPosition()
      restoreFileSelection()
    }
  }

  onMount(async () => {
    getFiles();
    sortFiles();
    restoreSideBarItemScrollPosition()
    restoreFileSelection()
  });

  /** 
   * Restore the previous SideBar file selection.
   * Unless it's empty (never set). In which case, select the first of `files`
   * Unless it's -also- empty, in which case, do not select anything
  */
  function restoreFileSelection() {
    if (files.length > 0) {
      selectFile(sideBarItem.selectedFileId !== '' ? sideBarItem.selectedFileId : files[0].id)
    }
  }
  
  function saveOutgoingSideBarItemScrollPosition() {
    if (!fileEl || oldState.sideBar.selectedItemId == '') return 
    
    window.api.send("dispatch", {
      type: "SAVE_SIDEBAR_SCROLL_POSITION",
      sideBarItemId: oldState.sideBar.selectedItemId,
      scrollposition: fileEl.scrollTop
    });
  }

  async function restoreSideBarItemScrollPosition() {
    await tick();
    fileEl.scrollTop = sideBarItem.scrollPosition
  }

  async function scrollElementIntoView(element, animate = true) {
    if (element) {
      element.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: animate ? "smooth" : "auto"
      });
    }
  }

  function getChildFolderIds(parentFolder) {
    let ids = [];

    const children = state.contents.map(c => {
      if (c.type == "folder" && c.parentId == parentFolder.id) {
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
      !state.contents.length > 0
    ) {
      return [];
    }

    const searchParams = sideBarItem.filesSearchParams

    const folderId = searchParams.lookInFolderId;
    const includeChildren = searchParams.includeChildren;
    const tags = searchParams.tags;
    const filterDateModified = searchParams.filterDateModified;
    const filterDateCreated = searchParams.filterDateCreated;

    // Get selected folder
    const folder = state.contents.find(
      c => c.type == "folder" && c.id == folderId
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
      const from = new Date(searchParams.fromDateModified);
      const to = new Date(searchParams.toDateModified);
      files = files.filter(f => {
        const modified = new Date(f.modified);
        if (modified < from && modified > to) {
          return f;
        }
      });
    }

    // Filter by date modified
    if (filterDateCreated) {
      const from = new Date(searchParams.fromDateCreated);
      const to = new Date(searchParams.toDateCreated);
      files = files.filter(f => {
        const created = new Date(f.created);
        if (created < from && created > to) {
          return f;
        }
      });
    }
  }

  function sortFiles() {
    if (sortKey == "title") {
      if (sortOrder == "ascending") {
        files.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortOrder == "descending") {
        files.sort((a, b) => b.title.localeCompare(a.title));
      }
    }
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
      case "ArrowUp": {
        event.preventDefault();
        const currentIndex = files.findIndex((f) => f.id == sideBarItem.selectedFileId)
        if (currentIndex > 0) {
          const prevFileId = files[currentIndex - 1].id;
          const prevFileEl = fileEl.querySelector('.selected').previousSibling
          selectFile(prevFileId)
          scrollElementIntoView(prevFileEl, true)
        }
        break;
      }
      case "ArrowDown": {
        event.preventDefault();
        const currentIndex = files.findIndex((f) => f.id == sideBarItem.selectedFileId)
        if (currentIndex < files.length - 1) {
          const nextFileId = files[currentIndex + 1].id;
          const nextFileEl = fileEl.querySelector('.selected').nextSibling
          selectFile(nextFileId)
          scrollElementIntoView(nextFileEl, true)
        }
        break;
      }
    }
  }

  function selectFile(id) {
    window.api.send("dispatch", {
      type: "SELECT_FILE",
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
</style>

<svelte:window on:keydown={handleKeydown} />

<div id="files" class:focused bind:this={fileEl}>
  {#each files as file}
    <FileListItem
      state={state}
      title={file.title}
      excerpt={file.excerpt}
      selected={file.id == sideBarItem.selectedFileId}
      on:click={() => {if (file.id !== sideBarItem.selectedFileId) selectFile(file.id)}} />
  {/each}
</div>
