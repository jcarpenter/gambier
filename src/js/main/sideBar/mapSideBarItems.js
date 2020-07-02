import { Folder } from './Folder'

let newItems = {}

/**
 * Filter items always operate on the top-level (root) folder.
 * Update their `lookInFolder` properties to point to root folder id.
 * @param {*} newItems 
 */
function updateFilters(newItems, rootFolderId) {
  
  return newItems.map((i) => {
    if (i.type == 'filter') {
      i.searchParams.lookInFolderId = rootFolderId
    }
    return i
  })
}

function updateFolders(newItems) {

  // Update `folder` type items:
  // Update root folder item. This item holds the project file hierarchy, in the UI.
  const rootFolderItem = newItems.find((i) => i.type == 'folder' && i.isRoot)
  rootFolderItem.label = rootFolder.name
  rootFolderItem.id = rootFolder.id
  rootFolderItem.searchParams.lookInFolderId = rootFolder.id

  // Remove existing child folder items.
  // TODO: Diff (don't remove). We don't want to blow away user-settings:
  // - selectedFileId
  // - lastScrollPosition
  // - lastSelection
  // - expanded
  newState.sideBar.items = newState.sideBar.items.filter((i) => i.isRoot || i.type !== 'folder')

  // Add child folder items.
  // For each, set parent item as root folder item, and push into items array.
  if (rootFolder.childFolderCount > 0) {
    createAndInsertChildFolderItems(rootFolder)
  }

}

/**
 * For the specified folder in `folders`, find its children,
 * create a new sideBar item for each, and recursively do 
 * the same for their children, in turn
 * @param {*} folder 
 */
function createAndInsertChildFolderItems(folder) {
  newState.folders.map((c) => {
    if (c.parentId == folder.id) {

      const childFolder = Object.assign({}, Folder)

      childFolder.type = 'folder'
      childFolder.label = c.name
      childFolder.id = c.id
      childFolder.parentId = folder.id
      childFolder.isRoot = false
      childFolder.icon = 'images/folder.svg'
      childFolder.showFilesList = true
      childFolder.searchParams.lookInFolderId = c.id
      childFolder.searchParams.includeChildren = false
      childFolder.selectedFileId = ''
      childFolder.lastScrollPosition = 0
      childFolder.lastSelection = []

      newState.sideBar.items.push(childFolder)

      // Recursive loop
      if (c.childFolderCount > 0) {
        createAndInsertChildFolderItems(c)
      }
    }
  })
}

export function mapSideBarItems(newState) {

  // Copy existing items
  newItems = newState.sideBar.items

  // Get root folder from `folders`. It's the one without a parentId
  const rootFolder = newState.folders.find((f) => f.parentId == '')

  // Update `filter` and `folder` items
  newItems = updateFilters(newItems, rootFolder.id)
  // updateFolders(newItems)

  return newItems
}



