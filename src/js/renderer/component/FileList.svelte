<script>
  /**
   * Render files in a folder as a vertical list
   */
  import { onMount, tick } from "svelte";
  import FileListItem from "./FileListItem.svelte";
  import { updateFileList, sortFileList } from "../fileListUpdate";

  export let state = {};
  export let oldState = {};
  export let focused;

  // Files
  let files = [];
  let fileEl
  let mounted = false

  $: sideBarItem = state.sideBar.items.find((i) => i.id == state.selectedSideBarItemId)
  $: searchParams = sideBarItem.searchParams
  $: focused = state.focusedLayoutSection == 'navigation'

  $: onStateChange(state)

  function onStateChange(state) {

    if (!mounted) return

    if (state.changed.includes("selectedSideBarItemId")) {
      saveOutgoingSideBarItemScrollPosition()
      files = updateFileList(state, searchParams)
      files = sortFileList(files, searchParams)
      files = restoreSelection(files, sideBarItem.lastSelection)
      setScrollPosition()
    } else if (state.changed.includes("contents")) {
      files = updateFileList(state, searchParams)
      files = sortFileList(files, searchParams)
      files = restoreSelection(files, sideBarItem.lastSelection)
    }
  }

  onMount(async () => {
    files = updateFileList(state, searchParams)
    files = sortFileList(files, searchParams)
    files = restoreSelection(files, sideBarItem.lastSelection)
    setScrollPosition()
    mounted = true
  });




  // -------- UTILITY METHODS -------- //

  function getFirstSelectedFileIndex(files) {
    return files.findIndex((f) => f.selected)
  }

  function getLastSelectedFileIndex(files) {
    let l = files.length
    while (l--) {
      if (files[l].selected) {
        break
      }
    }
    return l
  }

  function saveOutgoingSideBarItemScrollPosition() {
    if (!fileEl || oldState.selectedSideBarItemId == '') return 
    
    window.api.send("dispatch", {
      type: "SAVE_SIDEBAR_SCROLL_POSITION",
      sideBarItemId: oldState.selectedSideBarItemId,
      lastScrollPosition: fileEl.scrollTop
    });
  }

  async function setScrollPosition() {
    await tick();
    fileEl.scrollTop = sideBarItem.lastScrollPosition
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

  // -------- INTERACTIONS -------- //

  /**
   * Handle key presses
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
        const firstSelected = getFirstSelectedFileIndex(files)
        if (firstSelected > 0) {
          select(firstSelected - 1, event.shiftKey)
        }
        break;
      }
      case "ArrowDown": {
        event.preventDefault();
        const lastSelected = getLastSelectedFileIndex(files)
        if (lastSelected < files.length - 1) {
          select(lastSelected + 1, event.shiftKey)
        }
        break;
      }
    }
  }

  /** 
   * Handle click, shift-click, and command-click events
   * - Click: select file
   * - Meta-click: toggle selected
   * - Shift-click, select range
  */
  function handleClick(event, index) {

    if (!event.metaKey && !event.shiftKey) {
      select(index, false)
    } else if (event.metaKey) {
      toggleSelected(index)
    }
    else if (event.shiftKey) {

      // Is anything selected?
      const isAnythingSelected = files.some((f) => f.selected)

      // If no, simply mark from start of list to clicked file (index)
      // If yes, logic is more complicated
      if (!isAnythingSelected) {
        selectRange(0, index)
      } else {
        
        // Find first and last currently-selected files
        const firstSelected = getFirstSelectedFileIndex(files)
        const lastSelected = getLastSelectedFileIndex(files)      

        // Set start and end depending on where user is clicking, relative to 
        // currently-selected files.
        if (index < firstSelected) {
          selectRange(index, firstSelected)
        } else if (index > lastSelected) {
          selectRange(lastSelected, index)
        } else if (index > firstSelected && index < lastSelected) {
          selectRange(firstSelected, index)
        }
      }
    }    
  }


  // -------- SELECT -------- //

  function select(index, addToExistingSelection) {
    if (addToExistingSelection) {
      files[index].selected = true
    } else {
      files.forEach((f, i) => {
        f.selected = i == index
      });
    }
    scrollElementIntoView(fileEl.children[index], true)
    files = files
    dispatchSelectionChangesToStore()
  }

  function toggleSelected(index) {
    files[index].selected = !files[index].selected
    files = files
    dispatchSelectionChangesToStore()
  }

  function selectRange(start, end) {
    for (let i = start; i <= end; i++) {
      files[i].selected = true
    }
    files = files
    dispatchSelectionChangesToStore()
  }

  /**
   * Set file `selected` based on previously selected items. Each 
   * @param {} files - Array of files, as originally created by `updateFileList`.
   * @param {*} previousSelections - Each is object: `{ index: 0, id: 'file-3234376' }`
   */
  function restoreSelection(files, lastSelection = []) {
    
    if (files.length == 0) return files
    
    let markedFiles = files

    // If there were no previous selections, simply select first file
    // Else, try to restore the selections.
    // If none of the previously-selected items exist in the updated `files`,
    // (e.g. in the case of a selected file being deleted), pick the next file/

    if (lastSelection.length == 0) {
      markedFiles[0].selected = true
    } else {
      let newlySelectedFiles = []
      markedFiles.forEach((f) => {
        const selected = lastSelection.some((s) => s.id == f.id)
        if (selected) {
          f.selected = true
          newlySelectedFiles.push(f)
        }
      })
      if (newlySelectedFiles.length == 0) {
        markedFiles[lastSelection[0].index].selected = true
      }
    }

    dispatchSelectionChangesToStore()
    return markedFiles
  }

  function dispatchSelectionChangesToStore() {
    
    let selectedFiles = []
    
    files.forEach((f, i) => {
      if (f.selected) {
        selectedFiles.push({ index: i, id: f.id })
      }
    })
      
    window.api.send("dispatch", {
      type: "SAVE_SIDEBAR_FILE_SELECTION",
      sideBarItemId: sideBarItem.id,
      lastSelection: selectedFiles
    });
  }


  // -------- DELETE -------- //

  window.api.receive('mainRequestsDeleteFile', deleteFile)

  function deleteFile() {

    let selectedPaths = []
    
    files.forEach((f, index) => {
      if (f.selected) {
        selectedPaths.push(f.path)
      }
    });

    if (selectedPaths.length == 1) {
      window.api.send("dispatch", {
        type: "DELETE_FILE",
        path: selectedPaths[0]
      });
    } else if (selectedPaths.length > 1) {
      window.api.send("dispatch", {
        type: "DELETE_FILES",
        paths: selectedPaths
      });
    }
  }


</script>

<style type="text/scss">
  @import "../../../styles/_variables.scss";

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
  {#each files as file, index (file.id)}
    <FileListItem
      state={state}
      title={file.title}
      excerpt={file.excerpt}
      selected={file.selected}
      on:click={handleClick(event, index)} />
  {/each}
</div>