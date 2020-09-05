import { pathExists } from 'fs-extra'
import diff from 'deep-diff'

/**
 * Get a SideBar item object, based on id. 
 * NOTE: This is a copy of the same function in renderer/utils. If one changes, the other should also.
 */
function getSideBarItemById(state, id) {
  if (id.includes('folder')) {
    return state.sideBar.folders.find((f) => f.id == id)
  } else if (id.includes('docs')) {
    return state.sideBar.documents.find((d) => d.id == id)
  } else if (id.includes('media')) {
    return state.sideBar.media.find((m) => m.id == id)
  }
}


async function isWorkingPath(path) {

  if (path == '') {
    return false
  } else {
    if (await pathExists(path)) {
      return true
    } else {
      return false
    }
  }
}

function applyDiffs(oldContents, newContents) {

  diff.observableDiff(oldContents, newContents, (d) => {
    console.log(d)
    // Apply all changes except to the name property...
    // if (d.path[d.path.length - 1] !== 'name') {
    // }
    diff.applyChange(oldContents, newContents, d);
  })

  return oldContents
}

export { getSideBarItemById, applyDiffs, isWorkingPath }