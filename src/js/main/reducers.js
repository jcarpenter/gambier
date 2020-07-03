import { mapSideBarItems } from './sideBar/mapSideBarItems'
import path from 'path'


function getSideBarItem(newState, id) {
  if (id.includes('folder')) {
    return newState.sideBar.folders.find((i) => i.id == id)
  } else if (id.includes('docs')) {
    return newState.sideBar.documents.find((i) => i.id == id)
  } else if (id.includes('media')) {
    return newState.sideBar.media.find((i) => i.id == id)
  }  
}

/**
 * Update top-level `state.openDoc`. It is a copy of the selected doc's object from `state.documents`. We only "open" a doc if _one_ doc is selected in docList. If multiple are selected, we display nothing in the editor. 
 * @param {*} newState 
 * @param {*} id - Selected file `id`
 */
function updateOpenDoc(newState, selectedSideBarItem) {

  if (selectedSideBarItem.lastSelection.length == 1) {
    const docToOpen = newState.documents.find((c) => c.id == selectedSideBarItem.lastSelection[0].id)
    if (docToOpen !== undefined) {
      newState.openDoc = Object.assign({}, docToOpen)
    } else {
      newState.openDoc = {}  
    }
  } else {
    newState.openDoc = {}
  }
}




/**
 * `state = {}` gives us a default, for possible first run empty '' value.
 */
async function reducers(state = {}, action) {

  const newState = Object.assign({}, state)

  newState.changed = [] // Reset on every action 

  switch (action.type) {

    
    // -------- PROJECT PATH -------- //

    case 'SET_PROJECTPATH_SUCCESS': {
      newState.projectPath = action.path
      newState.changed.push('projectPath')
      break
    }

    case 'SET_PROJECTPATH_FAIL': {
      // DO NOTHING
      break
    }


    // -------- UI -------- //

    case 'SET_LAYOUT_FOCUS': {
      newState.focusedLayoutSection = action.section
      newState.changed.push('focusedLayoutSection')
      break
    }


    // -------- EDITOR -------- //

    case 'LOAD_PATH_IN_EDITOR': {
      newState.editingFileId = action.id
      newState.changed.push('editingFileId')
      break
    }


    // -------- CONTENTS -------- //

    case 'MAP_PROJECT_CONTENTS': {
      
      // Update `folders`, `documents`, `media`
      newState.folders = action.folders
      newState.documents = action.documents
      newState.media = action.media
      newState.changed.push('folders', 'documents', 'media')
      
      // Update sideBar
      newState.sideBar = mapSideBarItems(newState)
      newState.changed.push('sideBar')
      
      // Check if selectedSideBarItem still exists. If no, select first sideBar item. Covers scenario where a folder sideBar item was selected, then deleted from the disk.

      const allSideBarItems = newState.sideBar.folders.concat(newState.sideBar.documents, newState.sideBar.media)
      
      console.log(allSideBarItems)

      const selectedStillExists = allSideBarItems.some((sbi) => sbi.id == newState.selectedSideBarItem.id)

      if (!selectedStillExists) {
        newState.selectedSideBarItem = Object.assign({}, newState.sideBar.folders[0])
        newState.changed.push('selectedSideBarItem')
      }

      break
    }

    case 'ADD_DOCUMENTS': {
      newState.documents = newState.documents.concat(action.documents)
      newState.changed.push('documents')
      
      // Increment parent folder `childFileCount`
      action.documents.forEach((d) => {
        newState.folders.find((f) => f.path == path.dirname(d.path)).childFileCount++
      })
      newState.sideBar = mapSideBarItems(newState)
      newState.changed.push('sideBar')

      break
    }

    case 'ADD_MEDIA': {
      newState.media = newState.media.concat(action.media)
      newState.changed.push('media')
      
      // Increment parent folder `childFileCount`
      action.media.forEach((m) => {
        newState.folders.find((f) => f.path == path.dirname(m.path)).childFileCount++
      })
      newState.sideBar = mapSideBarItems(newState)
      newState.changed.push('sideBar')

      break
    }

    case 'UPDATE_DOCUMENTS': {
      for (let updatedVersion of action.documents) {
        // Get index of old version in `documents`
        const index = newState.documents.findIndex((oldVersion) => oldVersion.id == updatedVersion.id)
        // Confirm old version exists (index is not -1)
        // And replace it with new version
        if (index !== -1) {
          newState.documents[index] = updatedVersion
        }
      }
      newState.changed.push('documents')
      break
    }

    case 'UPDATE_MEDIA': {
      for (let updatedVersion of action.media) {
        // Get index of old version in `media`
        const index = newState.media.findIndex((oldVersion) => oldVersion.id == updatedVersion.id)
        // Confirm old version exists (index is not -1)
        // And replace it with new version
        if (index !== -1) {
          newState.media[index] = updatedVersion
        }
      }
      newState.changed.push('media')
      break
    }

    case 'REMOVE_DOCUMENTS': {
      for (let p of action.documentPaths) {
        const index = newState.documents.findIndex((d) => d.path == p)
        if (index !== -1) {
          newState.documents.splice(index, 1)
        }
        // Decrement parent folder `childFileCount`
        newState.folders.find((f) => f.path == path.dirname(p)).childFileCount--
      }
      newState.changed.push('documents', 'folders')
      newState.sideBar = mapSideBarItems(newState)
      newState.changed.push('sideBar')
      break
    }

    case 'REMOVE_MEDIA': {
      for (let p of action.mediaPaths) {
        const index = newState.media.findIndex((d) => d.path == p)
        if (index !== -1) {
          newState.media.splice(index, 1)
        }
        // Decrement parent folder `childFileCount`
        newState.folders.find((f) => f.path == path.dirname(p)).childFileCount--
      }
      newState.changed.push('media', 'folders')
      newState.sideBar = mapSideBarItems(newState)
      newState.changed.push('sideBar')
      break
    }


    // -------- SIDEBAR -------- //

    case 'SELECT_SIDEBAR_ITEM': {

      if (newState.selectedSideBarItem.id == action.item.id) break

      // Get reference to item inside newState.sideBar.
      // This is the object we need to update (and then copy)
      const item = getSideBarItem(newState, action.item.id)

      // Update DocList visibility
      if (newState.showFilesList !== item.showFilesList) {
        newState.showFilesList = item.showFilesList
        newState.changed.push('showFilesList')
      }

      // Copy selected item object to `selectedSideBarItem`
      newState.selectedSideBarItem = Object.assign({}, item)
      newState.changed.push('selectedSideBarItem')

      // Update `openDoc`
      updateOpenDoc(newState, item)
      newState.changed.push('openDoc')

      break 
    }

    // This is set on the _outgoing_ item, when the user is switching SideBar items.
    case 'SAVE_SIDEBAR_LAST_SELECTION': {
      const item = getSideBarItem(newState, action.item.id)
      if (!item) break 

      item.lastSelection = action.lastSelection
      newState.selectedSideBarItem.lastSelection = item.lastSelection
      newState.changed.push('lastSelection')

      // Update `openDoc`
      updateOpenDoc(newState, item)
      newState.changed.push('openDoc')
      break
    }

    // This is set on the _outgoing_ item, when the user is switching SideBar items.
    case 'SAVE_SIDEBAR_SCROLL_POSITION': {
      const item = getSideBarItem(newState, action.item.id)
      if (!item) break 
      item.lastScrollPosition = action.lastScrollPosition
      newState.changed.push('lastScrollPosition')
      break
    }

    case 'TOGGLE_SIDEBAR_ITEM_EXPANDED': {
      const item = getSideBarItem(newState, action.item.id)
      if (!item) break 
      item.expanded = !item.expanded
      newState.changed.push('item expanded')
      break
    }

    case 'SET_SORT': {
      console.log("SET_SORT")

      const item = getSideBarItem(newState, action.item.id)
      item.sort = action.sort
      newState.selectedSideBarItem.sort = action.sort
      newState.changed.push('sort')
      console.log(action.sort)

      break
    }

    // -------- FILE ACTIONS -------- //

    // case 'SAVE_FILE_SUCCESS': {
    //   console.log(`Reducers: SAVE_FILE_SUCCESS: ${action.path}`.green)
    //   break
    // }

    // case 'SAVE_FILE_FAIL': {
    //   console.log(`Reducers: SAVE_FILE_FAIL: ${action.path}`.red)
    //   break
    // }

    // // Delete

    // case 'DELETE_FILE_SUCCESS': {
    //   console.log(`Reducers: DELETE_FILE_SUCCESS: ${action.path}`.green)
    //   break
    // }

    // case 'DELETE_FILE_FAIL': {
    //   console.log(`Reducers: DELETE_FILE_FAIL: ${action.err}`.red)
    //   break
    // }

    // case 'DELETE_FILES_SUCCESS': {
    //   console.log(`Reducers: DELETE_FILES_SUCCESS: ${action.paths}`.green)
    //   break
    // }

    // case 'DELETE_FILES_FAIL': {
    //   console.log(`Reducers: DELETE_FILES_FAIL: ${action.err}`.red)
    //   break
    // }

  }

  return newState
}

export default reducers