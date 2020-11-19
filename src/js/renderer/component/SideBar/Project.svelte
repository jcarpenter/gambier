<script>
  import { project, sidebar, files } from '../../StateManager'
  import { createTreeHierarchy, createFlatHierarchy } from 'hierarchy-js'

  import Header from './Header.svelte'
  import SearchField from '../UI/SearchField.svelte'
  import Separator from '../UI/Separator.svelte'
  import Row from './treelist/Row.svelte'
  import produce, { enablePatches, produceWithPatches } from 'immer'
  import File from './treelist/File.svelte'
  import Folder from './treelist/Folder.svelte';
  import { iterator } from 'hierarchy-js/lib/services/createCopy'

  enablePatches()

  $: tab = $sidebar.tabsById.project
  $: isQueryEmpty = query == ''
  $: transitionTime = isQueryEmpty ? 300 : 0
  $: isSidebarFocused = $project.focusedLayoutSection == 'sidebar'

  let flat
  let query = '' // Bound to search field
  let resultsTree = []
  let resultsFlat = []
  let resultsVisible = []

  // $: console.log(tree)

  /* ---- How file updating works ----
   * User makes changes to project directory (e.g. adds a file).
   * Watcher chokidar instance catches. (main)
   * Updates its `files`, then sends patches to render process.
   * StateManager receives patches (render)
   * Applies them to it's 1:1 copy of files (`filesAsObject`), to keep them in sync.
   * Updates its files store (`files`). Which is exported.
   * Svelte components import `files` store.
   * Creates immutabale copy using immer, in `makeStore`
   * Updates whenever `$files` store from StateManager updates.
   * Immutable child components see their dependencies have updated, but only update when their objects are replaced.
   */

  let tree

  $: $files, tab.expanded, makeTree()
  // $: tab.expanded, updateTree()

  function makeTree() {

    // if (!$files.tree) return
    const projectFolder = $files.tree[0]

    // Use immer to apply changes immutably (leaving $files untouched).
    tree = produce(
      projectFolder,
      (draft) => {
        sortTree(draft)
        mapVisibleDescendants(draft, true)
        insertEmptyRows(draft)
      }
      // (patches, inversePatches) => {
      //   console.log(patches)
      // }
    )

    console.log(tree)

    // flat = createFlatHierarchy(tree)
    // console.log(flat)

    // flat.forEach((r, index) => {
    //   // Skip top-level folder. Most of it's properties are not set.
    //   const isTopFolder = r.parentId == ''
    //   if (!isTopFolder) {
    //     const color = r.isVisible ? 'white' : 'gray'
    //     console.log(
    //       `%c${r.indexInAllVisible ? r.indexInAllVisible : '/'} ${r.indexInVisibleSiblings} ${'—'.repeat(
    //         r.details.nestDepth
    //       )} ${r.details.name}`,
    //       `color:${color}`
    //     )
    //   }
    // })
  }

  function sortTree(folder) {
    // Sort
    folder.children.sort((a, b) => {
      const itemA = $files.byId[a.id]
      const itemB = $files.byId[b.id]
      return itemA.name.localeCompare(itemB.name)
    })
    folder.children.forEach((c) => {
      const type = $files.byId[c.id].type
      // Recursively sort
      if (type == 'folder' && c.children.length) {
        sortTree(c)
      }
    })
  }

  function mapVisibleDescendants(folder, isRoot = false) {
    
    folder.numVisibleDescendants = 0
    const isExpanded = tab.expanded.some((id) => id == folder.id)

    if (!isRoot && !isExpanded)  return { numVisibleDescendants: 0 }

    folder.children.forEach((c) => {
      folder.numVisibleDescendants++
      const file = $files.byId[c.id]
      if (file.type == 'folder') {
        const { numVisibleDescendants } = mapVisibleDescendants(c)
        folder.numVisibleDescendants += numVisibleDescendants
      }
    })

    return {
      numVisibleDescendants: folder.numVisibleDescendants,
    }
  }

  function insertEmptyRows(folder) {

    // For each expanded folder, insert empty sibling elements equal to the length of folder's visible descendants.

    for (var i = 0; i < folder.children.length; i++) {
      
      let c = folder.children[i]
      if (c.id.includes('empty')) continue
      const file = $files.byId[c.id]
      const isExpandedFolder = file.type == 'folder' && tab.expanded.some((id) => id == c.id)

      if (isExpandedFolder) {

        let emptyItems = []
        for (var x = 0; x < c.numVisibleDescendants; x++) {
          emptyItems.push({id: `empty-${c.id}-${x}`})
        }

        folder.children.splice(i + 1, 0, ...emptyItems)
        insertEmptyRows(c)
      }
    }
  }


  // -------- RESULTS -------- //

  // function updateSelected(children) {
  //   children.forEach((r) => {
  //     r.isSelected = tab.selected.some((id) => id = r.id)
  //     if (r.children && r.children.length) {
  //       updateSelected(r.children)
  //     }
  //   })
  // }

  // Update `resultsTree` and `resultsFlat` when folders, files, or search query change.
  // $: {
  //   index = 0
  //   indexInAllVisibleItems = 0
  //   if (query == '') {
  //     resultsTree = createTreeHierarchy([].concat(...[folders, files]))[0]
  //       .children
  //     sortChildren(resultsTree)
  //   } else {
  //     resultsTree = files.filter((f) =>
  //       // Convert to uppercase so the search is case insensitive
  //       f.name.toUpperCase().includes(query.toUpperCase())
  //     )
  //     sortChildren(resultsTree)
  //   }

  //   resultsFlat = resultsTree.length ? createFlatHierarchy(resultsTree) : []
  // }

  // // Update `resultsVisible` when `resultsFlat` or `tab` changes
  // $: {
  //   resultsVisible = []
  //   if (resultsFlat.length) {
  //     for (let i = 0; i < resultsFlat.length; i++) {
  //       const result = resultsFlat[i]
  //       resultsVisible.push(result)
  //       if (result.type == 'folder') {
  //         const isExpanded = tab.expanded.some((id) => id == result.id)
  //         if (!isExpanded) {
  //           i += result.recursiveChildCount
  //         }
  //       }
  //     }
  //   }
  // }

  // -------- KEY DOWN -------- //

  function handleKeydown(evt) {
    if (!isSidebarFocused) return
    switch (evt.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
        evt.preventDefault()
        handleArrowLeftRight(evt.key)
        break
      case 'ArrowUp':
      case 'ArrowDown':
        evt.preventDefault()
        handleArrowUpDown(evt.key, evt.shiftKey, evt.altKey)
        break
    }
  }

  function handleArrowLeftRight(key) {
    console.log('handleArrowLeftRight: ', key)
    return
    const item = resultsFlat.find((r) => r.id == tab.lastSelected)

    const isFolder = item.type == 'folder'
    const isExpanded = isFolder && tab.expanded.some((id) => id == item.id)

    if (isFolder) {
      // Toggle expanded
      if (!isExpanded && key == 'ArrowRight') {
        toggleExpanded(item, isExpanded)
      } else if (isExpanded && key == 'ArrowLeft') {
        toggleExpanded(item, isExpanded)
      }
    } else if (!isFolder && key == 'ArrowLeft') {
      // Jump selection to parent folder
      console.log('Jump selection to parent folder')
      selectParentFolder(item)
    }
  }

  function handleArrowUpDown(key, shiftPressed, altPressed) {
    let item = {}
    let selected = []

    // Checks
    const indexOfLastSelectedItemInResultsVisible = resultsVisible.findIndex(
      (r) => r.id == tab.lastSelected
    )
    const isStillVisible = indexOfLastSelectedItemInResultsVisible !== -1
    const isAlreadyAtStartOfResultsVisible =
      indexOfLastSelectedItemInResultsVisible == 0
    const isAlreadyAtEndOfResultsVisible =
      indexOfLastSelectedItemInResultsVisible + 1 == resultsVisible.length

    // Determine next item
    if (!isStillVisible || altPressed) {
      // If last selected item is no longer visible (e.g. parent folder since toggled closed), OR alt is pressed: select first or last item in list.
      switch (key) {
        case 'ArrowUp':
          item = resultsVisible[0]
          break
        case 'ArrowDown':
          item = resultsVisible[resultsVisible.length - 1]
          break
      }
    } else if (key == 'ArrowUp' && isAlreadyAtStartOfResultsVisible) {
      // If arrowing up, and already at start, (re)select first item in list
      item = resultsVisible[0]
    } else if (key == 'ArrowDown' && isAlreadyAtEndOfResultsVisible) {
      // If arrowing down, and already at end, (re)select last item in list
      item = resultsVisible[resultsVisible.length - 1]
    } else {
      switch (key) {
        case 'ArrowUp':
          item = resultsVisible[indexOfLastSelectedItemInResultsVisible - 1]
          break
        case 'ArrowDown':
          item = resultsVisible[indexOfLastSelectedItemInResultsVisible + 1]
          break
      }
    }

    // Select it, or add it to existing selection, depending on whether shift is pressed
    if (shiftPressed) {
      selected = tab.selected.slice()
      selected.push(item.id)
    } else {
      selected = [item.id]
    }

    // Update selection
    window.api.send('dispatch', {
      type: 'SELECT_SIDEBAR_ITEMS',
      tabName: 'project',
      lastSelected: id,
      selected: selected,
    })
  }

  // -------- MOUSE DOWN -------- //

  function selectFile(evt) {
    const {file, isSelected} = evt.detail

    const domEvent = evt.detail.domEvent

    // Shift-click: Select range of items in list
    // Click while not selected: Make this the only selected item
    // Cmd-click while not selected: Add this to existing items
    // Cmd-click while selected: Remove this from existing items

    const shiftClicked = domEvent.shiftKey
    const clickedWhileSelected = !domEvent.metaKey && isSelected
    const clickedWhileNotSelected = !domEvent.metaKey && !isSelected
    const cmdClickedWhileNotSelected = domEvent.metaKey && !isSelected
    const cmdClickedWhileSelected = domEvent.metaKey && isSelected

    let selected = []

    if (clickedWhileSelected) {
      return
    } else if (shiftClicked) {
      const clickedIndex = resultsVisible.findIndex((r) => r.id == file.id)
      const lastSelectedIndex = resultsVisible.findIndex(
        (r) => r.id == tab.lastSelected.id
      )
      const lastSelectedIsStillVisible = lastSelectedIndex !== -1

      selected = tab.selected.slice()

      if (!lastSelectedIsStillVisible) {
        selected = [file.id]
      } else {
        const selectFromIndex = Math.min(clickedIndex, lastSelectedIndex)
        const selectToIndex = Math.max(clickedIndex, lastSelectedIndex)
        resultsVisible.forEach((r, index) => {
          if (index >= selectFromIndex && index <= selectToIndex) {
            selected.push(r.id)
          }
        })
      }
    } else if (clickedWhileNotSelected) {
      selected.push(file.id)
    } else if (cmdClickedWhileNotSelected) {
      selected = tab.selected.concat([file.id])
    } else if (cmdClickedWhileSelected) {
      // Copy array and remove this item from it
      selected = tab.selected.slice()
      const indexToRemove = selected.findIndex((id) => id == file.id)
      selected.splice(indexToRemove, 1)
    }

    window.api.send('dispatch', {
      type: 'SELECT_SIDEBAR_ITEMS',
      tabId: 'project',
      lastSelected: id,
      selected: selected,
    })
  }

  // -------- HELPERS -------- //

  function toggleExpanded(evt) {
    const {file, isExpanded} = evt.detail
    let expanded = tab.expanded.slice()
    switch (isExpanded) {
      case true:
        const indexToRemove = expanded.findIndex((id) => id == file.id)
        expanded.splice(indexToRemove, 1)
        break
      case false:
        expanded.push(file.id)
        break
    }
    window.api.send('dispatch', {
      type: 'EXPAND_SIDEBAR_ITEMS',
      tabId: 'project',
      expanded: expanded,
    })
  }

  function selectParentFolder(item) {
    const parentFolder = folders.find((f) => f.id == item.parentId)
    window.api.send('dispatch', {
      type: 'SELECT_SIDEBAR_ITEMS',
      tabName: 'project',
      lastSelected: id,
      selected: [parentFolder.id],
    })
  }
</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  #project {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex-grow: 1;
  }

  .wrapper:not(.active) {
    display: none;
  }

  #results {
    padding: 10px;
    flex-grow: 1;
    // min-height: 100%;
    overflow-y: scroll;
    position: relative;
  }
</style>

<svelte:window on:keydown={handleKeydown} />

<div id="project" class="wrapper" class:active={tab.active}>
  <Header title={tab.title}>
    <!-- Sort -->
  </Header>
  <Separator marginSides={10} />
  <SearchField focused bind:query placeholder={'Name'} />
  <div id="results">
    <Folder {tree} isRoot={true} on:selectFile={selectFile} on:toggleExpanded={toggleExpanded} />
    <!-- {#each sortedTree.children as item (item.id)}
      <Row
        {item}
        {isQueryEmpty}
        on:selectFile={selectFile}
        on:toggleExpanded={toggleExpanded} />
    {/each} -->
    <!-- {#each tree as item (item.id)}
      {#if item.type == 'Empty'}
        <div class="emptyItem" />
      {:else}
        <Row
          {item}
          {isSidebarFocused}
          isQueryEmpty={query == ''}
          on:mousedown={handleMouseDown}
          on:toggleExpanded={(evt) => {
            toggleExpanded(evt.detail.item, evt.detail.isExpanded)
          }} />
      {/if}
    {/each} -->
    <!-- {#each tree as item (item.id)}
      <Row
        {item}
        {isSidebarFocused}
        isQueryEmpty={query == ''}
        on:mousedown={handleMouseDown}
        on:toggleExpanded={(evt) => {
          toggleExpanded(evt.detail.item, evt.detail.isExpanded)
        }} />
    {/each} -->
  </div>
</div>
