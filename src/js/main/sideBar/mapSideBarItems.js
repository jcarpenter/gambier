import { makeSideBarItem } from './makeSideBarItem'

/**
 * For each folder in the project, create a corresponding SideBar item.
 * This is run each time 
 */
function mapFolders(sideBar, newState) {

  // Save existing folders, then clear
  const oldFolders = sideBar.folders
  sideBar.folders = []
  
  // Make new array of existing folders.
  newState.folders.forEach((f) => {
    
    // Get old version (if it exists)
    const oldFolder = oldFolders.find((oldF) => oldF.id == f.id)

    // Determine icon
    const icon = f.childFileCount > 0 ? 'images/folder.svg' : 'images/folder-outline.svg'

    // Make new version
    const newFolder = makeSideBarItem(
      'folder', 
      f.name, 
      f.id, 
      f.parentId, 
      icon, 
      true, 
      {
        lookInFolderId: f.id,
        includeChildren: false,
        filetypes: ['*'],
        tags: [],
        dateModified: { use: false, from: '', to: '' },
        dateCreated: { use: false, from: '', to: '' },
      }
    )
    
    // Copy values from old version (if one existed)
    if (oldFolder) {
      newFolder.sort = oldFolder.sort,
      newFolder.files = oldFolder.files,
      newFolder.lastScrollPosition = oldFolder.lastScrollPosition,
      newFolder.expanded = oldFolder.expanded,
      newFolder.children = []
    }

    // Sort alphabetically by label
    sideBar.folders.sort((a, b) => a.label.localeCompare(b.label))

    sideBar.folders.push(newFolder)
  })

  return sideBar
}



/**
 * Return `sideBar` with updated `folders`
 * TODO: Also update `documents`, `media`, and `citations` here?
 */
export function mapSideBarItems(newState) {

  // Copy the sideBar object (so we don't effect the original)
  let sideBar = Object.assign({}, newState.sideBar)

  // Get root folder from `folders`. It's the one without a parentId
  // const rootFolder = newState.folders.find((f) => f.parentId == '')

  // Update `sideBar.folders`
  sideBar = mapFolders(sideBar, newState)

  return sideBar
}



