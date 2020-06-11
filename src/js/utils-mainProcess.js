import { pathExists } from 'fs-extra'
import diff from 'deep-diff'

async function isWorkingPath(pth) {

  if (pth == 'undefined') {
    return false
  } else {
    if (await pathExists(pth)) {
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

export { applyDiffs, isWorkingPath }