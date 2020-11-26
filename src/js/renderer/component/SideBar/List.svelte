<script>
	import { project, sidebar, files } from '../../StateManager'
	
	export let isTreeList = false
	export let tabId = ''
	export let listIds = []
	
  $: tab = $sidebar.tabsById[tabId]
	$: isSidebarFocused = $project.focusedLayoutSection == 'sidebar'

	// -------- KEY DOWN -------- //

	function onKeydown(evt) {
		if (!isSidebarFocused) return
		switch (evt.key) {
			case 'ArrowLeft':
			case 'ArrowRight':
				if (isTreeList) {
					evt.preventDefault()
					arrowLeftRight(evt.key)
				}
				break
			case 'ArrowUp':
			case 'ArrowDown':
				evt.preventDefault()
				arrowUpDown(evt.key, evt.shiftKey, evt.altKey)
				break
		}
	}

  function arrowUpDown(key, shiftPressed, altPressed) {
    
    let id = '' // of newly-selected item
    let selected = []

    const lastSelectedIndex = listIds.indexOf(tab.lastSelected)

    const isLastSelectedStillVisible = lastSelectedIndex !== -1
    const atTop = lastSelectedIndex == 0
    const atBottom = lastSelectedIndex == listIds.length - 1

    // Determine next file
    if (!isLastSelectedStillVisible) {
      // If last selected file is no longer visible (e.g. parent folder has since closed), select first or last file in list. On arrow up, select last file. Do oppposite for arrow down. Shift or alt have no effect.
      id = key == 'ArrowUp' ? listIds[listIds.length-1] : listIds[0]
      selected = [id]
    } else if (altPressed) {
      // If alt is pressed, jump to top or bottom of list.
      id = key == 'ArrowUp' ? listIds[0] : listIds[listIds.length-1]
      // If shift pressed, include all items between lastSelected and top/bottom
      // and add to the existing selection.
      if (shiftPressed) {
        const lastSelectedIsStillVisible = lastSelectedIndex !== -1
        // If last selected item is no longer visible (e.g. parent 
        // folder may have closed), select all items
        if (!lastSelectedIsStillVisible) {
          selected = [...listIds]
        } else {
          const newSelectedIndex = listIds.indexOf(id)
          const selectFromIndex = Math.min(newSelectedIndex, lastSelectedIndex)
          const selectToIndex = Math.max(newSelectedIndex, lastSelectedIndex)
          const newSelected = listIds.slice(selectFromIndex, selectToIndex + 1)
          const lastSelected = [...tab.selected]
          selected = [...newSelected, ...lastSelected]
        }

      } else {
        selected = [id]
      }
    } else if (key == 'ArrowUp' && atTop) {
      // If arrowing up and already at top...
      if (tab.selected.length > 1) {
        // If there are multiple items selected...
        if (!shiftPressed){
          // If shift key is not pressed, clear, and select only first item.
          id = listIds[0]
          selected = [id]
        } else {
          // Else, do nothing.
          return
        }
      } else {
        // Else, do nothing.
        return
      }
    } else if (key == 'ArrowDown' && atBottom) {
      // [Same as arrowing up]
      // If arrowing down and already at bottom...
      if (tab.selected.length > 1) {
        // If there are multiple items selected...
        if (!shiftPressed){
          // If shift key is not pressed, clear, and select only last item.
          id = listIds[listIds.length - 1]
          selected = [id]
        } else {
          // Else, do nothing.
          return
        }
      } else {
        // Else, do nothing.
        return
      }
    } else if (shiftPressed) {
      // const newSelectedIndex = listIds.indexOf(id)

      // Are we shift-arrowing into an existing selection?
      // Get selected id. Then check if it's already selected
      // If yes, deselect lastSelected (thereby shrinking the selectiub)
      
      id = key == 'ArrowUp' ? listIds[lastSelectedIndex - 1] : listIds[lastSelectedIndex + 1]
      const isAlreadySelected = tab.selected.includes(id)
      
      if (isAlreadySelected) {
        const indexOfLastSelectedInSelected = tab.selected.indexOf(tab.lastSelected)
        selected = [...tab.selected]
        selected.splice(indexOfLastSelectedInSelected, 1)
      } else {
        // Else, add id to the existing selection.
        selected = [id, ...tab.selected]
      }
    } else {
      // Select previous or next
      id = key == 'ArrowUp' ? listIds[lastSelectedIndex - 1] : listIds[lastSelectedIndex + 1]
      selected = [id]
    }

    // If there are multiple selected, find and remove any duplicates.
    // Per: https://stackoverflow.com/a/14438954
    if (selected.length > 1) {
      selected = Array.from(new Set(selected))
    }

    // Update selection
    window.api.send('dispatch', {
      type: 'SIDEBAR_SET_SELECTED',
      tabId: tabId,
      lastSelected: id,
      selected: selected,
    })
  }

  // -------- TREE-LIST FUNCTIONS -------- //
		
	function arrowLeftRight(key) {

		// Open close 
		const file = $files.byId[tab.lastSelected]
		const isFolder = file.type == 'folder'
		const isExpanded = isFolder && tab.expanded.some((id) => id == file.id)

		if (key == 'ArrowLeft') {
			if (isFolder && isExpanded) {
				toggleExpanded(file.id, isExpanded)
			} else {
				selectParentFolder(file.id)
			}
		} else if (key == 'ArrowRight'){
			if (isFolder && !isExpanded) {
				toggleExpanded(file.id, isExpanded)
			}
		}
	}

  function selectParentFolder(childId) {
    const parentId = $files.byId[childId].parentId
    
    // If `listIds` does not include parent ID, we're at the top-level.
		// There's no visible parent to select, so return.
		console.log(listIds)
    if (!listIds.includes(parentId)) return
    
    window.api.send('dispatch', {
      type: 'SIDEBAR_SET_SELECTED',
      tabId: tabId,
      lastSelected: parentId,
      selected: [parentId],
    })
  }

	function toggleExpanded(id, isExpanded) {
		let expanded = [...tab.expanded]
		switch (isExpanded) {
			case true:
				const indexToRemove = expanded.indexOf(id)
				expanded.splice(indexToRemove, 1)
				break
			case false:
				expanded.push(id)
				break
		}
		window.api.send('dispatch', {
			type: 'SIDEBAR_SET_EXPANDED',
			tabId: tabId,
			expanded: expanded,
		})
	}

</script>

<style type="text/scss">
	.list {
    padding: 10px;
    flex-grow: 1;
    overflow-y: scroll;
    position: relative;
  }
</style>

<svelte:window on:keydown={onKeydown} />

<div class="list">
	<slot></slot>
</div>