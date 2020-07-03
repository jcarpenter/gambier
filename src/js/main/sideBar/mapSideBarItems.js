import { makeItem } from './makeItem'

/**
 * Update `folder` items
 */
function mapFolders(sideBar, newState) {

  // Save existing folders, then clear
  const oldFolders = sideBar.folders
  sideBar.folders = []
  
  // Make new array of existing folders.
  newState.folders.forEach((f) => {
    
    // Get old version
    const oldFolder = oldFolders.find((oldF) => oldF.id == f.id)

    // Determine icon
    const icon = f.childFileCount > 0 ? 'images/folder.svg' : 'images/folder-outline.svg'

    // Make new version
    const newFolder = makeItem(
      'folder', 
      f.name, 
      f.id, 
      f.parentId, 
      icon, 
      true, 
      {
        lookInFolderId: f.id,
        includeChildren: false,
        tags: [],
        filterDateModified: false,
        fromDateModified: '',
        toDateModified: '',
      }
    )
    
    // Copy over old values
    if (oldFolder) {
      newFolder.selectedFileId = oldFolder.selectedFileId,
      newFolder.lastScrollPosition = oldFolder.lastScrollPosition,
      newFolder.expanded = oldFolder.expanded,
      newFolder.lastSelection = oldFolder.lastSelection,
      newFolder.children = []
    }

    // Sort alphabetically by label
    sideBar.folders.sort((a, b) => a.label.localeCompare(b.label))

    sideBar.folders.push(newFolder)
  })

  return sideBar
}



/**
 * Return `sideBar` with updated `folders`, `documents`, `media`, and `citations`.
 * @param {*} newState - Reference to the newState
 */
export function mapSideBarItems(newState) {

  // Copy the sideBar object (so we don't effect the original)
  let sideBar = Object.assign({}, newState.sideBar)

  // Get root folder from `folders`. It's the one without a parentId
  const rootFolder = newState.folders.find((f) => f.parentId == '')

  // Update `sideBar.folders`
  sideBar = mapFolders(sideBar, newState)

  return sideBar
}



