<script>
  import { createTreeHierarchy, createFlatHierarchy } from 'hierarchy-js'
  import SearchField from '../UI/SearchField.svelte'
  import Separator from '../UI/Separator.svelte'
  import TreeListItem2 from './TreeListItem2.svelte'

  export let state = {}
  export let focused

  // State
  let tab = {}
  let folders = []
  let files = []

  // Local
  let firstRun = true
  let active = false
  let query = ''
  let resultsTree = []
  let resultsFlat = []
  let resultsVisible = []

  // -------- STATE -------- //

  $: onStateChange(state)

  // State changes
  function onStateChange(state) {
    if (firstRun) {
      tab = state.sideBar2.tabs.find((t) => t.name == 'project')
      active = state.sideBar2.activeTab.name == 'project'
      folders = state.folders
      files = [].concat(...[state.documents, state.media])
      firstRun = false
    }

    if (state.changed.includes('sideBar.tabs.project')) {
      tab = state.sideBar2.tabs.find((t) => t.name == 'project')
    } else if (state.changed.includes('sideBar.activeTab')) {
      active = state.sideBar2.activeTab.name == 'project'
    } else if (
      state.changed.includes('folders') ||
      state.changed.includes('documents') ||
      state.changed.includes('media')
    ) {
      folders = state.folders
      files = [].concat(...[state.documents, state.media])
    } else if (state.changed.includes('openDoc')) {
      console.log('openDoc changed')
    }
  }

  // -------- RESULTS -------- //

  let index = 0

  // Update `resultsTree` and `resultsFlat` when folders, files, or search query change.
  $: {
    index = 0
    if (query == '') {
      resultsTree = createTreeHierarchy([].concat(...[folders, files]))[0]
        .children
      sortChildren(resultsTree)
    } else {
      resultsTree = files.filter((f) =>
        // Convert to uppercase so the search is case insensitive
        f.name.toUpperCase().includes(query.toUpperCase())
      )
      sortChildren(resultsTree)
    }

    resultsFlat = resultsTree.length ? createFlatHierarchy(resultsTree) : []
  }

  // Update `resultsVisible` when `resultsFlat` or `tab` changes
  $: {
    resultsVisible = []
    if (resultsFlat.length) {
      for (let i = 0; i < resultsFlat.length; i++) {
        const result = resultsFlat[i]
        resultsVisible.push(result)
        if (result.type == 'folder') {
          const isExpanded = tab.expandedItems.some((id) => id == result.id)
          if (!isExpanded) {
            i += result.recursiveChildCount
          }
        }
      }
    }
  }

  // -------- KEY DOWN -------- //

  function handleKeydown(evt) {
    if (!focused) return
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
    const item = resultsFlat.find((r) => r.id == tab.lastSelectedItem)

    const isFolder = item.type == 'folder'
    const isExpanded = isFolder && tab.expandedItems.some((id) => id == item.id)

    if (isFolder) {
      // Toggle expanded
      if (!isExpanded && key == 'ArrowRight') {
        toggleExpanded(item, isExpanded)
      } else if (isExpanded && key == 'ArrowLeft') {
        toggleExpanded(item, isExpanded)
      }
    } else if (!isFolder && key == 'ArrowLeft') {
      // Jump selection to parent folder
      selectParentFolder(item)
    }
  }

  function handleArrowUpDown(key, shiftPressed, altPressed) {
    let nextItem = {}
    let selectedItems = []

    // Checks
    const indexOfLastSelectedItemInResultsVisible = resultsVisible.findIndex(
      (item) => item.id == tab.lastSelectedItem
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
          nextItem = resultsVisible[0]
          break
        case 'ArrowDown':
          nextItem = resultsVisible[resultsVisible.length - 1]
          break
      }
    } else if (key == 'ArrowUp' && isAlreadyAtStartOfResultsVisible) {
      // If arrowing up, and already at start, (re)select first item in list
      nextItem = resultsVisible[0]
    } else if (key == 'ArrowDown' && isAlreadyAtEndOfResultsVisible) {
      // If arrowing down, and already at end, (re)select last item in list
      nextItem = resultsVisible[resultsVisible.length - 1]
    } else {
      switch (key) {
        case 'ArrowUp':
          nextItem = resultsVisible[indexOfLastSelectedItemInResultsVisible - 1]
          break
        case 'ArrowDown':
          nextItem = resultsVisible[indexOfLastSelectedItemInResultsVisible + 1]
          break
      }
    }

    // Select it, or add it to existing selection, depending on whether shift is pressed
    if (shiftPressed) {
      selectedItems = tab.selectedItems.slice()
      selectedItems.push(nextItem.id)
    } else {
      selectedItems = [nextItem.id]
    }

    // Update selection
    window.api.send('dispatch', {
      type: 'SELECT_SIDEBAR_ITEMS',
      tabName: 'project',
      lastSelectedItem: nextItem.id,
      selectedItems: selectedItems,
    })
  }

  // -------- MOUSE DOWN -------- //

  function handleMouseDown(evt) {
    const item = evt.detail.item
    const isSelected = evt.detail.isSelected
    const domEvent = evt.detail.domEvent

    // Shift-click: Select range of items in list
    // Click while not selected: Make this the only selected item
    // Cmd-click while not selected: Add this to existing items
    // Cmd-click while selected: Remove this from existing items

    const shiftClicked = domEvent.shiftKey
    const clickedWhileNotSelected = !domEvent.metaKey && !isSelected
    const cmdClickedWhileNotSelected = domEvent.metaKey && !isSelected
    const cmdClickedWhileSelected = domEvent.metaKey && isSelected

    let selectedItems = []

    if (shiftClicked) {
      const clickedIndex = resultsVisible.findIndex((r) => r.id == item.id)
      const lastSelectedIndex = resultsVisible.findIndex(
        (r) => r.id == tab.lastSelectedItem
      )
      const lastSelectedIsStillVisible = lastSelectedIndex !== -1

      selectedItems = tab.selectedItems.slice()

      if (!lastSelectedIsStillVisible) {
        selectedItems = [item.id]
      } else {
        const selectFromIndex = Math.min(clickedIndex, lastSelectedIndex)
        const selectToIndex = Math.max(clickedIndex, lastSelectedIndex)
        resultsVisible.forEach((r, index) => {
          if (index >= selectFromIndex && index <= selectToIndex) {
            selectedItems.push(r.id)
          }
        })
      }
    } else if (clickedWhileNotSelected) {
      selectedItems.push(item.id)
    } else if (cmdClickedWhileNotSelected) {
      selectedItems = tab.selectedItems.concat([item.id])
    } else if (cmdClickedWhileSelected) {
      // Copy array and remove this item from it
      selectedItems = tab.selectedItems.slice()
      const indexToRemove = selectedItems.findIndex((id) => id == item.id)
      selectedItems.splice(indexToRemove, 1)
    }

    window.api.send('dispatch', {
      type: 'SELECT_SIDEBAR_ITEMS',
      tabName: 'project',
      lastSelectedItem: item.id,
      selectedItems: selectedItems,
    })
  }

  // -------- HELPERS -------- //

  /**
   * Sort array of child items by sorting criteria
   * // TODO: Criteria is currently hard coded to alphabetical and A-Z.
   */
  function sortChildren(children) {
    children.sort((a, b) => a.name.localeCompare(b.name))
    children.forEach((c) => {
      c.index = index++
      if (query == '' && c.type == 'folder' && c.children.length > 0) {
        sortChildren(c.children)
      }
    })
  }

  function toggleExpanded(item, isExpanded) {
    let expandedItems = tab.expandedItems.slice()
    switch (isExpanded) {
      case true:
        const indexToRemove = expandedItems.findIndex((id) => id == item.id)
        expandedItems.splice(indexToRemove, 1)
        break
      case false:
        expandedItems.push(item.id)
        break
    }
    window.api.send('dispatch', {
      type: 'EXPAND_SIDEBAR_ITEMS',
      tabName: tab.name,
      expandedItems: expandedItems,
    })
  }

  function selectParentFolder(item) {
    window.api.send('dispatch', {
      type: 'SELECT_SIDEBAR_ITEMS',
      tabName: 'project',
      lastSelectedItem: item.parentId,
      selectedItems: [item.parentId],
    })
  }

  function test(e) {
    console.log(e)
  }
</script>

<style type="text/css">
  @import '../../../../styles/_mixins.scss';

  .wrapper:not(.active) {
    display: none;
  }

  .focused {
    /* border: 1px solid red; */
  }

  #results {
    margin: 10px;
    max-height: 100%;
    overflow: hidden;
  }

  h1 {
    user-select: none;
    color: var(--labelColor);
  }
</style>

<svelte:window on:keydown={handleKeydown} />

<div id="project" class="wrapper" class:focused class:active>
  <header>
    <h1>{tab.title}</h1>
  </header>
  <Separator />
  <SearchField bind:query placeholder={'Name'} />
  <div id="results">
    {#each resultsTree as item}
      <TreeListItem2
        on:mousedown={handleMouseDown}
        on:toggleExpanded={(evt) => {
          toggleExpanded(evt.detail.item, evt.detail.isExpanded)
        }}
        parent={tab}
        {item} />
    {/each}
  </div>
</div>
