/**
 * Check if contents contains item by type and id
 */
// function contentContainsItemById(contents, type, id) {
//   return contents.some((d) => d.type == type && d.id == id)
// }

// function getDirectoryById(contents, id) {
//   return contents.find((d) => d.type == 'directory' && d.id == id)
// }

// function getFirstFileInDirectory(contents, directoryId) {
//   const files = contents.filter((f) => f.type == 'file' && f.parentId == directoryId)
//   return files[0]
// }

function getRootFolder(contents) {
  return contents.find((d) => d.type == 'folder' && d.isRoot)
}

function getSideBarItem(sideBarItems, id) {
  return sideBarItems.find((i) => i.id == id)
}








function updateSideBarItems(newState) {

  const rootFolder = getRootFolder(newState.contents)

  // Update `filesFilter` type items. 
  // Specifically, their lookInFolder values, to point to correct `contents` id.
  newState.sideBar.items.forEach((i) => {
    if (i.type == 'filesFilter') {
      i.filesSearchParams.lookInFolderId = rootFolder.id
    }
  })

  // Update root folder item values. This item holds the project file hierarchy, in the UI.
  const rootFolderItem = newState.sideBar.items.find((i) => i.type == 'filesFolder' && i.isRoot)
  rootFolderItem.label = rootFolder.name
  rootFolderItem.id = rootFolder.id
  rootFolderItem.filesSearchParams.lookInFolderId = rootFolder.id

  // Remove existing child folder items.
  newState.sideBar.items = newState.sideBar.items.filter((i) => i.isRoot || i.type !== 'filesFolder')

  // Add child folder items.
  // For each, set parent item as root folder item, and push into items array.
  if (rootFolder.childFolderCount > 0) {
    createAndInsertChildFolderItems(rootFolder)
  }

  function createAndInsertChildFolderItems(folder) {

    // For the given folder in contents, find it's children,
    // create a new sideBar item for each, and recursively do 
    // the same for their children, in turn

    newState.contents.map((c) => {
      if (c.type == 'folder' && c.parentId == folder.id) {

        const childFolderItem = {
          label: c.name,
          id: c.id,
          parentId: folder.id,
          type: 'filesFolder',
          isRoot: false,
          icon: 'images/folder.svg',
          showFilesList: true,
          filesSearchParams: {
            lookInFolderId: c.id,
            includeChildren: false
          },
          selectedFileId: ''
        }

        newState.sideBar.items.push(childFolderItem)

        // Recursive loop
        if (c.childFolderCount > 0) {
          createAndInsertChildFolderItems(c)
        }
      }
    })
  }
}






/**
 * `state = {}` gives us a default, for possible first run empty '' value.
 */
function reducers(state = {}, action) {

  const newState = Object.assign({}, state)

  // newState.lastAction = action.type
  newState.changed = [] // Reset on every action 

  switch (action.type) {

    case 'SET_LAYOUT_FOCUS': {
      newState.focusedLayoutSection = action.section
      newState.changed.push('focusedLayoutSection')
      break
    }

    case 'TOGGLE_SIDEBAR_ITEM_EXPANDED': {
      const sideBarItem = getSideBarItem(newState.sideBar.items, action.id)
      sideBarItem.expanded = !sideBarItem.expanded
      newState.changed.push('sideBar item expanded')
      break
    }

    case 'SET_PROJECT_PATH': {
      newState.projectPath = action.path
      newState.changed.push('projectPath')
      break
    }

    case 'MAP_HIERARCHY': {
      newState.contents = action.contents

      // Set `rootDirId`
      const rootFolder = getRootFolder(newState.contents)
      newState.rootFolderId = rootFolder.id

      updateSideBarItems(newState)

      newState.changed.push('sideBar', 'contents')
      break
    }

    case 'SELECT_SIDEBAR_ITEM': {
      
      const sideBarItem = getSideBarItem(newState.sideBar.items, action.id)
      
      // Update FileList visibility
      newState.showFilesList = sideBarItem.showFilesList
      newState.changed.push('showFilesList')
      
      // Update selected SideBar item
      newState.sideBar.selectedItemId = action.id
      newState.changed.push('sideBar.selectedItemId')

      // Update selected file
      newState.selectedFileId = sideBarItem.selectedFileId
      newState.changed.push('selectedFileId')
      
      break
    }

    // This is set on the _outgoing_ item, when the user is switching SideBar items.
    // 
    case 'SAVE_SIDEBAR_SCROLL_POSITION': {
      const sideBarItem = getSideBarItem(newState.sideBar.items, action.sideBarItemId)
      sideBarItem.scrollPosition = action.scrollposition
      newState.changed.push('sideBar scrollposition')
      break
    }

    case 'SELECT_FILE': {

      // Update the `selectedItemId` value of the active sideBar item
      const sideBarItem = getSideBarItem(newState.sideBar.items, newState.sideBar.selectedItemId)

      if (sideBarItem.type == 'filesFolder' || sideBarItem.type == 'filesFilter') {
        sideBarItem.selectedFileId = action.fileId
      }

      // Update the `selectedFileId`
      newState.selectedFileId = action.fileId

      newState.changed.push('selectedFileId')

      break
    }

    case 'SET_STARTUP_TIME': {
      newState.appStartupTime = action.time
      newState.changed.push('appStartupTime')
      break
    }

    case 'RESET_HIERARCHY': {
      newState.contents = []
      newState.changed.push('contents')
      break
    }
  }

  return newState
}

export default reducers