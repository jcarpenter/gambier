<script>
  import { createTreeHierarchy, createFlatHierarchy } from 'hierarchy-js'
  import SearchField from '../UI/SearchField.svelte'
  import Separator from '../UI/Separator.svelte'
  import Header from './Header.svelte'
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

  $: transitionTime = query == '' ? 300 : 0

  $: onStateChange(state)

  // State changes
  function onStateChange(state) {
    let shouldUpdateResults = false

    if (state.changed.includes('sideBar.tabs.project') || firstRun) {
      tab = state.sideBar2.tabs.find((t) => t.name == 'project')
      shouldUpdateResults = true
    }

    if (state.changed.includes('sideBar.activeTab') || firstRun) {
      active = state.sideBar2.activeTab.name == 'project'
      shouldUpdateResults = true
    }

    if (
      state.changed.includes('folders') ||
      state.changed.includes('documents') ||
      state.changed.includes('media') ||
      firstRun
    ) {
      folders = state.folders
      files = [].concat(...[state.documents, state.media])
      shouldUpdateResults = true
    }

    if (state.changed.includes('openDoc') || firstRun) {
      // console.log('openDoc changed')
      shouldUpdateResults = true
    }

    if (shouldUpdateResults) updateResults()

    firstRun = false
  }

  /*
Each item needs to know it's index among visible items. But only it's local index.
*/

  // -------- RESULTS -------- //

  let index = 0
  let indexInAllVisibleItems = 0
  let results2Tree = []
  let results2Flat = []

  // Update results when following change:
  // * Folders or files
  // * Search query change
  // * Search query change
  function updateResults() {
    index = 0
    indexInAllVisibleItems = 0

    if (query == '') {
      const foldersAndFiles = [].concat(...[folders, files])
      results2Tree = createTreeHierarchy(foldersAndFiles)[0].children
      sortChildren(results2Tree, true, 0)
      // console.log(results2Tree)

      // results2Flat = createFlatHierarchy(results2Tree, {
      //   saveExtractedChildren: true,
      // })

      // results2Flat.forEach((r) => {
      //   if (r.type == 'folder' && r.children && r.children.length) {
      //     r.children = r.children.map((c) => c.id)
      //   }
      // })
    }
  }

  // function updateSelected(children) {
  //   children.forEach((r) => {
  //     r.isSelected = tab.selectedItems.some((id) => id = r.id)
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
  //         const isExpanded = tab.expandedItems.some((id) => id == result.id)
  //         if (!isExpanded) {
  //           i += result.recursiveChildCount
  //         }
  //       }
  //     }
  //   }
  // }

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
    const item = resultsFlat.find((r) => r.id == tab.lastSelectedItem.id)

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
      console.log('Jump selection to parent folder')
      selectParentFolder(item)
    }
  }

  function handleArrowUpDown(key, shiftPressed, altPressed) {
    let item = {}
    let selectedItems = []

    // Checks
    const indexOfLastSelectedItemInResultsVisible = resultsVisible.findIndex(
      (r) => r.id == tab.lastSelectedItem.id
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
      selectedItems = tab.selectedItems.slice()
      selectedItems.push(item.id)
    } else {
      selectedItems = [item.id]
    }

    // Update selection
    window.api.send('dispatch', {
      type: 'SELECT_SIDEBAR_ITEMS',
      tabName: 'project',
      lastSelectedItem: { id: item.id, type: item.type },
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
    const clickedWhileSelected = !domEvent.metaKey && isSelected
    const clickedWhileNotSelected = !domEvent.metaKey && !isSelected
    const cmdClickedWhileNotSelected = domEvent.metaKey && !isSelected
    const cmdClickedWhileSelected = domEvent.metaKey && isSelected

    let selectedItems = []

    if (clickedWhileSelected) {
      return
    } else if (shiftClicked) {
      const clickedIndex = resultsVisible.findIndex((r) => r.id == item.id)
      const lastSelectedIndex = resultsVisible.findIndex(
        (r) => r.id == tab.lastSelectedItem.id
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
      lastSelectedItem: { id: item.id, type: item.type },
      selectedItems: selectedItems,
    })
  }

  // -------- HELPERS -------- //

  /**
   * Sort array of child items by sorting criteria
   * // TODO: Criteria is currently hard coded to alphabetical and A-Z.
   */
  function sortChildren(children, parentHierarchyIsExpanded, parentOffset) {

    let indexAmongSiblings = 0
    
    // Sort
    children.sort((a, b) => a.name.localeCompare(b.name))

    // For each child, set properties (e.g. indexes)
    children.forEach((c) => {
      // Set index within all items
      c.indexInAllItems = index++

      // Set index within all visible items
      if (parentHierarchyIsExpanded) {
        c.indexInAllVisibleItems = indexInAllVisibleItems++
      }

      // Set index within local visible items. We use this to set vertical position of element, within siblings.
      if (c.nestDepth > 1) {
        c.indexInLocalVisibleItems =
          c.indexInAllVisibleItems - parentOffset - 1
      } else {
        c.indexInLocalVisibleItems = c.indexInAllVisibleItems - parentOffset
      }


      // Set index within siblings. Depends on if siblings are expanded or not.
      c.indexAmongSiblings = indexAmongSiblings++

      // Set visible
      c.visible = parentHierarchyIsExpanded

      // Set selected
      c.isSelected = tab.selectedItems.find((id) => id == c.id)

      // If folder...
      if (c.type == 'folder') {
        // Set expanded
        c.isExpanded = tab.expandedItems.some((id) => id == c.id)

        // Recursively sort children
        if (c.children.length > 0) {
          const isParentExpanded = parentHierarchyIsExpanded && c.isExpanded
          sortChildren(c.children, isParentExpanded, c.indexInLocalVisibleItems)
        }
      }
    })

    // Set number of visible children. Have to wait until other values are set before we can do this.
    children.forEach((c, index) => {
      if (c.type == 'folder') {
        if (c.isExpanded) {
          // = number of visible items until next sibling
          const isLastChild = index == children.length - 1
          if (!isLastChild) {
            const nextSibling = children[index + 1]
            // console.log(c.name, nextSibling.name)
            c.numberOfVisibleChildren =
              nextSibling.indexInAllVisibleItems - c.indexInAllVisibleItems - 1
          } else {
            // c.numberOfVisibleChildren = c.indexInAllVisibleItems +
          }
        } else {
          // console.log("NE: ", c.name)
          // c.numberOfVisibleChildren = 0
        }
      }

      console.log(c.name, c.indexAmongSiblings)

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
    const parentFolder = folders.find((f) => f.id == item.parentId)
    window.api.send('dispatch', {
      type: 'SELECT_SIDEBAR_ITEMS',
      tabName: 'project',
      lastSelectedItem: { id: parentFolder.id, type: parentFolder.type },
      selectedItems: [parentFolder.id],
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

  .focused {
    /* border: 1px solid red; */
  }

  #results {
    margin: 10px 10px 0;
    min-height: 100%;
    overflow-y: scroll;
    position: relative;
  }
</style>

<svelte:window on:keydown={handleKeydown} />

<div id="project" class="wrapper" class:focused class:active>
  <Header title={tab.title}>
    <!-- Sort -->
  </Header>
  <Separator marginSides={10} />
  <SearchField focused bind:query placeholder={'Name'} />
  <div id="results">
    {#each results2Tree as item}
      <TreeListItem2
        {item}
        listHasFocus={focused}
        isQueryEmpty={query == ''}
        on:mousedown={handleMouseDown}
        on:toggleExpanded={(evt) => {
          toggleExpanded(evt.detail.item, evt.detail.isExpanded)
        }} />
    {/each}
  </div>
</div>
