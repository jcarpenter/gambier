import { stat, readdir } from 'fs-extra'
import path from 'path'
import { mapDocument } from './mapDocument'
import { mapMedia } from './mapMedia'
import { isDoc, isMedia, getMediaType } from '../../shared/utils.js'
// import colors from 'colors'


/**
 * For specified folder path, map the folder and it's child  
 * documents, media, and citations, and return `contents` object
 * with four arrays (one for each type).
 * @param {*} files - Reference to shared object we write changes to, and then return
 * @param {*} parentTreeItem - Tree item to add self to
 * @param {*} folderPath - Path to map
 * @param {*} stats - Optional. Can pass in stats, or if undefined, will get them in function.
 * @param {*} parentId - Optional. If undefined, we regard the folder as `root`
 * @param {*} nestDepth - Optional.
 */
export async function mapFolder(files, parentTreeItem, folderPath, stats = undefined, parentId = '', nestDepth = 0) {

  // -------- New Folder -------- //

  if (!stats) stats = await stat(folderPath)

  // Create and populate new folder
  const folder = {
    type: 'folder',
    name: folderPath.substring(folderPath.lastIndexOf('/') + 1),
    path: folderPath,
    id: `folder-${stats.ino}`,
    parentId: parentId,
    created: stats.birthtime.toISOString(),
    modified: stats.mtime.toISOString(),
    nestDepth: nestDepth,
    // --- Folder-specific --- //
    numChildren: 0,
    numDescendants: 0,
  }

  // Add to `files`
  files.byId[folder.id] = folder
  files.allIds.push(folder.id)

  // Populate tree details
  const treeItem = {
    id: folder.id,
    parentId: parentId,
    children: []
  }
  parentTreeItem.push(treeItem)


  // -------- Contents -------- //

  // Get everything in directory with `readdir`.
  // Returns array of `fs.Dirent` objects.
  // https://nodejs.org/api/fs.html#fs_class_fs_dirent
  const directoryContents = await readdir(folderPath, { withFileTypes: true })

  await Promise.all(
    directoryContents.map(async (f) => {

      // Get path by combining folderPath with file name.
      const filepath = path.join(folderPath, f.name)

      // Get extension
      const ext = path.extname(f.name)

      if (f.isDirectory()) {

        const { numDescendants } = await mapFolder(files, treeItem.children, filepath, undefined, folder.id, nestDepth + 1)

        // Increment child counters
        folder.numChildren++
        folder.numDescendants += numDescendants

      } else if (isDoc(ext) || isMedia(ext)) {

        const file = isDoc(ext) ? 
          await mapDocument(filepath, folder.id, nestDepth + 1) : 
          await mapMedia(filepath, folder.id, nestDepth + 1)

        files.byId[file.id] = file
        files.allIds.push(file.id)
        treeItem.children.push({
          id: file.id,
          parentId: folder.id,
        })

        // Increment child counters
        folder.numChildren++
      }
    })
  )

  folder.numDescendants += folder.numChildren

  return {
    numDescendants: folder.numDescendants
  }
}