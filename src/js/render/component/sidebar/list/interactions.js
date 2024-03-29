/*
A collection of common list interactions. These are shared across DocLists, TreeLists, etc.
*/

import { getCmDataByPanelId } from "../../../editor/editor-utils"

// -------- MOUSE DOWN -------- //

/**
 * Handle mouse down events on list items in project view.
 * - MD && NOT selected: Do nothing. We select on MouseUp.
 * - Shift+MD: Select range of items in list
 * - Cmd+MD && NOT selected: Add this to existing items
 * - Cmd+MD && selected: Remove this from existing items
 * @param {*} domEvent 
 * @param {*} id 
 * @param {*} isSelected 
 * @param {*} tab 
 * @param {*} tabId 
 * @param {*} listIds 
 * @param {*} files 
 * @returns 
 */
export function onMousedown(domEvent, id, isSelected, tab, tabId, listIds, files) {

  // If it's a normal click, do nothing.
  // We select individual items on mouseup.
  const isNormalClick = !domEvent.shiftKey && !domEvent.metaKey
  if (isNormalClick) return

  const shiftClicked = domEvent.shiftKey
  const cmdClickedWhileNotSelected = domEvent.metaKey && !isSelected
  const cmdClickedWhileSelected = domEvent.metaKey && isSelected

  let selected = []

  if (shiftClicked) {
    const clickedIndex = listIds.indexOf(id)
    const lastSelectedIndex = listIds.indexOf(tab.lastSelected)
    const lastSelectedIsStillVisible = lastSelectedIndex !== -1
    if (!lastSelectedIsStillVisible) {
      // If last selected item is no longer visible (e.g. parent 
      // folder may have closed), select only this id.
      selected = [id]
    } else {
      // Else, select all items between the last selected, and this id.
      const selectFromIndex = Math.min(clickedIndex, lastSelectedIndex)
      const selectToIndex = Math.max(clickedIndex, lastSelectedIndex)
      const newSelected = listIds.slice(selectFromIndex, selectToIndex + 1)
      const lastSelected = [...tab.selected]
      selected = [...newSelected, ...lastSelected]
    }
  } else if (cmdClickedWhileNotSelected) {
    selected = [id, ...tab.selected]
  } else if (cmdClickedWhileSelected) {
    // Copy array and remove this item from it
    selected = [...tab.selected]
    const indexToRemove = selected.indexOf(id)
    selected.splice(indexToRemove, 1)
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

/**
 * Select the file.
 * If it's a doc and not already open, open it. 
 */
export function onMouseup(domEvent, id, tab, tabId, panel, files) {

  const shiftOrMetaWerePressed = domEvent.shiftKey || domEvent.metaKey  
  const isDoc = files.byId[id].isDoc
  const isAlreadyOpen = id == panel.docId
  
  // If shift or meta were pressed, we read this as a 
  // "select stuff" action, and already handled it in MouseDown.
  // So we return without doing anything.
  if (shiftOrMetaWerePressed) return

  // If the selected file is a doc AND it's not already open, open it.
  // Else, just update the selection to selected the file, and deselect 
  // any other previously-selected files.
  if (isDoc && !isAlreadyOpen) {
    window.api.send('dispatch', {
      type: 'OPEN_DOC_IN_PANEL',
      panelIndex: panel.index,
      doc: files.byId[id],
      selectInSideBar: true,
      outgoingDoc: files.byId[panel.docId],
      outgoingDocData: panel.unsavedChanges ?
        getCmDataByPanelId(panel.id) : '',
      isNewDoc: panel.docId == 'newDoc'
    })
  } else {
    window.api.send('dispatch', {
      type: 'SIDEBAR_SET_SELECTED',
      tabId: tabId,
      lastSelected: id,
      selected: [id],
    }) 
  }

}

// -------- ARROW -------- //

export function arrowUpDown(key, shiftPressed, altPressed, tab, tabId, listIds, files, project) {

  let id = '' // of newly-selected item
  let selected = []

  const lastSelectedIndex = listIds.indexOf(tab.lastSelected)

  const isLastSelectedStillVisible = lastSelectedIndex !== -1
  const atTop = lastSelectedIndex == 0
  const atBottom = lastSelectedIndex == listIds.length - 1

  // Determine next file
  if (!isLastSelectedStillVisible) {
    // If last selected file is no longer visible (e.g. parent folder has since closed), select first or last file in list. On arrow up, select last file. Do oppposite for arrow down. Shift or alt have no effect.
    id = key == 'ArrowUp' ? listIds[listIds.length - 1] : listIds[0]
    selected = [id]
  } else if (altPressed) {
    // If alt is pressed, jump to top or bottom of list.
    id = key == 'ArrowUp' ? listIds[0] : listIds[listIds.length - 1]
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
      if (!shiftPressed) {
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
      if (!shiftPressed) {
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
    id = key == 'ArrowUp' ? 
      listIds[lastSelectedIndex - 1] : 
      listIds[lastSelectedIndex + 1]
    selected = [id]
    console.log(selected)
  }

  // If there are multiple selected, select them (but don't open).
  // If there's only one selection, open it.
  if (selected.length > 1) {

    // First find and remove any duplicates.
    // Per: https://stackoverflow.com/a/14438954
    selected = Array.from(new Set(selected))

    // Update selection
    window.api.send('dispatch', {
      type: 'SIDEBAR_SET_SELECTED',
      tabId: tabId,
      lastSelected: id,
      selected: selected,
    })

  } else {

    const isDoc = files.byId[id]?.isDoc
    
    // If selected is doc, open it.
    // Else, update the selection.

    if (isDoc) {

      const panel = project.panels.find(({index}) => index == project.focusedPanelIndex)
  
      window.api.send('dispatch', {
        type: 'OPEN_DOC_IN_PANEL',
        panelIndex: panel.index,
        doc: files.byId[id],
        selectInSideBar: true,
        outgoingDoc: files.byId[panel.docId],
        outgoingDocData: panel.unsavedChanges ?
          getCmDataByPanelId(panel.id) : '',
        isNewDoc: panel.docId == 'newDoc'
      })

    } else {
    
      window.api.send('dispatch', {
        type: 'SIDEBAR_SET_SELECTED',
        tabId,
        lastSelected: id,
        selected: [id],
      }) 

    }
  }
}

// -------- TREE-LIST FUNCTIONS -------- //

export function arrowLeftRight(key, tab, tabId, listIds, files) {

  const isMultipleSelected = tab.selected.length > 1

  if (isMultipleSelected) {

    const selectedFolders = files.allIds.filter((id) =>
      tab.selected.includes(id) &&
      files.byId[id].isFolder)

    let expanded = [...tab.expanded]

    if (key == 'ArrowLeft') {
      selectedFolders.forEach((id) => {
        if (expanded.includes(id)) {
          const indexToRemove = expanded.indexOf(id)
          expanded.splice(indexToRemove, 1)
        }
      })
    } else if (key == 'ArrowRight') {
      selectedFolders.forEach((id) => {
        if (!expanded.includes(id)) {
          expanded.push(id)
        }
      })
    }
    window.api.send('dispatch', {
      type: 'SIDEBAR_SET_EXPANDED',
      tabId: tabId,
      expanded: expanded,
    })

  } else {

    const file = files.byId[tab.lastSelected]
    const isExpanded = file.isFolder && tab.expanded.some((id) => id == file.id)

    if (key == 'ArrowLeft') {
      if (file.isFolder && isExpanded) {
        toggleExpanded(file.id, isExpanded, tab, tabId)
      } else {
        selectParentFolder(file.id, tabId, listIds, files)
      }
    } else if (key == 'ArrowRight') {
      if (file.isFolder && !isExpanded) {
        toggleExpanded(file.id, isExpanded, tab, tabId)
      }
    }
  }
}

function selectParentFolder(childId, tabId, listIds, files) {
  const parentId = files.byId[childId].parentId

  // If `listIds` does not include parent ID, we're at the top-level.
  // There's no visible parent to select, so return.
  if (!listIds.includes(parentId)) return

  window.api.send('dispatch', {
    type: 'SIDEBAR_SET_SELECTED',
    tabId: tabId,
    lastSelected: parentId,
    selected: [parentId],
  })
}

export function toggleExpanded(id, isExpanded, tab, tabId) {
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