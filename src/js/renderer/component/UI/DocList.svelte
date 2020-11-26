<script>
  /**
   * Render docs in a folder as a vertical list
   */
  import { onMount, tick } from "svelte";
  import DocListItem from "./DocListItem.svelte";
  // import { updateDocList, sortDocList } from "../docListUpdate";
  import { getSideBarItemById, isEmpty } from "../utils";

  export let state = {};
  export let oldState = {};
  export let focused;

  // Files
  let docs = [];
  let fileEl;
  let mounted = false;

  $: sideBarItem = getSideBarItemById(state, state.selectedSideBarItem.id);
  $: filter = sideBarItem.filter;
  $: sort = sideBarItem.sort;
  $: focused = state.focusedLayoutSection == "navigation";

  $: onStateChange(state);

  function onStateChange(state) {
    if (!mounted) return;

    if (state.changed.includes("selectedSideBarItem")) {
      saveOutgoingSideBarItemScrollPosition();
      docs = getDocs();
      setScrollPosition();
    } else if (
      state.changed.includes("sort") ||
      state.changed.includes("sideBar") ||
      state.changed.includes("folders") ||
      state.changed.includes("documents")
    ) {
      docs = getDocs();
    }
  }

  onMount(async () => {
    docs = getDocs();
    setScrollPosition();
    mounted = true;
  });

  // -------- UTILITY METHODS -------- //

  function getDocs() {
    let docs = [];

    sideBarItem.files.forEach(file => {
      let doc = state.documents.find(d => d.id == file.id);
      doc.selected = file.selected;
      docs.push(doc);
    });

    return docs;
  }

  function getFirstSelectedFileIndex(docs) {
    return docs.findIndex(f => f.selected);
  }

  function getLastSelectedFileIndex(docs) {
    let l = docs.length;
    while (l--) {
      if (docs[l].selected) {
        break;
      }
    }
    return l;
  }

  function saveOutgoingSideBarItemScrollPosition() {
    if (!fileEl || isEmpty(oldState.selectedSideBarItem)) return;

    window.api.send("dispatch", {
      type: "SAVE_SIDEBAR_SCROLL_POSITION",
      item: oldState.selectedSideBarItem,
      lastScrollPosition: fileEl.scrollTop
    });
  }

  async function setScrollPosition() {
    await tick();
    fileEl.scrollTop = sideBarItem.lastScrollPosition;
  }

  async function scrollElementIntoView(element, animate = true) {
    if (element) {
      element.scrollIntoView({
        block: "nearest",
        inline: "start",
        behavior: animate ? "smooth" : "auto"
      });
    }
  }

  // -------- INTERACTIONS -------- //

  /**
   * Handle key presses
   * User can press arrow keys to navigate up/down the list
   * TODO: SideBar + DocList should be one unified focus area. Pressing arrows while clicking inside SideBar should translate into up/down inside DocList.
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
        const firstSelected = getFirstSelectedFileIndex(docs);
        if (firstSelected > 0) {
          select(firstSelected - 1, event.shiftKey);
        }
        break;
      }
      case "ArrowDown": {
        event.preventDefault();
        const lastSelected = getLastSelectedFileIndex(docs);
        if (lastSelected < docs.length - 1) {
          select(lastSelected + 1, event.shiftKey);
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
      select(index, false);
    } else if (event.metaKey) {
      toggleSelected(index);
    } else if (event.shiftKey) {
      // Is anything selected?
      const isAnythingSelected = docs.some(f => f.selected);

      // If no, simply mark from start of list to clicked file (index)
      // If yes, logic is more complicated
      if (!isAnythingSelected) {
        selectRange(0, index);
      } else {
        // Find first and last currently-selected docs
        const firstSelected = getFirstSelectedFileIndex(docs);
        const lastSelected = getLastSelectedFileIndex(docs);

        // Set start and end depending on where user is clicking, relative to
        // currently-selected docs.
        if (index < firstSelected) {
          selectRange(index, firstSelected);
        } else if (index > lastSelected) {
          selectRange(lastSelected, index);
        } else if (index > firstSelected && index < lastSelected) {
          selectRange(firstSelected, index);
        }
      }
    }
  }

  // -------- SELECT -------- //

  function select(index, addToExistingSelection) {
    if (addToExistingSelection) {
      docs[index].selected = true;
    } else {
      docs.forEach((f, i) => {
        f.selected = i == index;
      });
    }
    scrollElementIntoView(fileEl.children[index], true);
    docs = docs;
    dispatchSelectionChangesToStore(docs);
  }

  function toggleSelected(index) {
    docs[index].selected = !docs[index].selected;
    docs = docs;
    dispatchSelectionChangesToStore(docs);
  }

  function selectRange(start, end) {
    for (let i = start; i <= end; i++) {
      docs[i].selected = true;
    }
    docs = docs;
    dispatchSelectionChangesToStore(docs);
  }

  /**
   * Set document `selected` property. First try to restore the `lastSelected` docs for the selected sideBar item. If there were none selected, select the first doc. Or if the selected docs no longer exist (e.g. after a deletion), select the next adjacent doc.
   * @param {} docs - Array of docs, as originally created by `updateDocList`.
   * @param {*} lastSelection - Array of objects: `{ index: 0, id: 'file-3234376' }`
   */
  function restoreLastSelection(docsBefore, lastSelection = []) {
    if (docsBefore.length == 0) return [];

    let docs = docsBefore;

    // Else, try to restore the selections.
    // If none of the previously-selected items exist in the updated `docs`, (e.g. in the case of a selected file being deleted), try to pick the next file. If already at the end of the list,

    // If there was a previous selections, try to restore it
    if (lastSelection.length > 0) {
      let isAtLeastOneFileSelected = false;

      // If current docs match lastSelection docs, select them
      docs.forEach(f => {
        if (lastSelection.some(s => s.id == f.id)) {
          f.selected = true;
          isAtLeastOneFileSelected = true;
        }
      });

      // If the previously selected docs do NOT exist any more (most commonly, after a selected doc was deleted), then try to select the "next" doc (the new doc at the same index number as the previously selected doc). Or if the previously-selected doc was last in the list, select the new last doc.
      if (!isAtLeastOneFileSelected) {
        if (lastSelection[0].index <= docs.length - 1) {
          docs[lastSelection[0].index].selected = true;
        } else {
          docs[docs.length - 1].selected = true;
        }
      }
    } else {
      // Else, just select the first file
      docs[0].selected = true;
    }

    dispatchSelectionChangesToStore(docs);
    return docs;
  }

  function dispatchSelectionChangesToStore(docs) {
    let selectedDocs = [];

    docs.forEach((f, i) => {
      if (f.selected) {
        selectedDocs.push({ index: i, id: f.id });
      }
    });

    window.api.send("dispatch", {
      type: "SELECT_FILES",
      sideBarItem: sideBarItem,
      selectedFiles: selectedDocs
    });
  }

  // -------- DELETE -------- //

  window.api.receive("mainRequestsDeleteFile", deleteFile);

  function deleteFile() {
    let selectedPaths = [];

    docs.forEach((f, index) => {
      if (f.selected) {
        selectedPaths.push(f.path);
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

  // -------- SORT -------- //
  // Bind displayed value to state
  // When user makes selection, dispatch that selection to store. Store will update, and state will update. But there will be a delay, waiting for IPC...
  // So need to basically hold the user's selection in the interim. And when the new value from state comes down, apply it.
  // Have internal state. Sync to state when state changes.

  function selectionMade() {
    window.api.send("dispatch", {
      type: "SET_SORT",
      item: sideBarItem,
      sort: sort
    });
  }
</script>

<style type="text/scss">
</style>

<svelte:window on:keydown={handleKeydown} />

<div id="docList">
  <div id="header">
    <h1>{sideBarItem.label}</h1>
    <div id="sorting-options">
      <label for="sort-select">Sort By:</label>
      <select
        name="Sort By"
        id="sort-select"
        bind:value={sort.by}
        on:change={selectionMade}>
        <option value="title">Title</option>
        <option value="date-modified">Date modified</option>
        <option value="date-created">Date created</option>
      </select>
    </div>
  </div>
  <div id="docs" class:focused bind:this={fileEl}>
    {#each docs as doc, index (doc.id)}
      <DocListItem
        {state}
        title={doc.title}
        excerpt={doc.excerpt}
        selected={doc.selected}
        on:click={event => handleClick(event, index)} />
    {/each}
  </div>
</div>
