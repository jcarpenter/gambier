import { stat, readdir } from 'fs-extra'
import path from 'path'
import { mapDocument, mapFolder, mapMedia, Folder, imageFormats, avFormats } from './index.js'
import colors from 'colors'

/**
 * For specified folder path, map the folder and it's child  
 * documents, media, and citations, and return `contents` object
 * with four arrays (one for each type).
 * @param {*} folderPath - Path to map
 * @param {*} stats - Optional. Can pass in stats, or if undefined, will get them in function.
 * @param {*} parentId - Optional. If undefined, we regard the folder as `root`
 * @param {*} recursive - Optional. If true, map descendant directories also.
 */
export default async function (folderPath, stats = undefined, parentId = '', recursive = false) {

  // Stub out return object
  let contents = {
    folders: [],
    documents: [],
    media: [],
  }

  // -------- Folder -------- //

  const folder = Object.assign({}, Folder)

  if (stats == undefined) {
    stats = await stat(folderPath)
  }

  folder.name = folderPath.substring(folderPath.lastIndexOf('/') + 1)
  folder.path = folderPath
  folder.id = `folder-${stats.ino}`
  folder.parentId = parentId
  folder.modified = stats.mtime.toISOString()

  contents.folders.push(folder)


  // -------- Contents -------- //

  // Get everything in directory with `readdir`.
  // Returns array of file name and file type pairs. If empty, return.
  const everything = await readdir(folderPath, { withFileTypes: true })
  // if (!everything.length > 0) return contents

  await Promise.all(
   everything.map(async (e) => {

      // Get path by combining folderPath with file name.
      const ePath = path.join(folderPath, e.name)
      const ext = path.extname(e.name)
      const stats = await stat(ePath)
    
      if (e.isDirectory() && recursive) {
        const { folders, documents, media } = await mapFolder(ePath, stats, folder.id, true)
        // Concat findings into respective `contents` arrays
        contents.folders = contents.folders.concat(folders)
        contents.documents = contents.documents.concat(documents)
        contents.media = contents.media.concat(media)
      } else if (ext == '.md') {
        contents.documents.push(await mapDocument(ePath, stats, folder.id))
      } else if (imageFormats.includes(ext) || avFormats.includes(ext)) {
        contents.media.push(await mapMedia(ePath, stats, folder.id, ext))
      }
    })
  )

  return contents
}