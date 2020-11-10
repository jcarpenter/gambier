import { stat, readdir } from 'fs-extra'
import path from 'path'
import { mapDocument, mapFolder, mapMedia } from './index.js'
import { Folder, imageFormats, avFormats } from './formats'
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
export default async function (files, folderPath, stats = undefined, parentId = '', recursive = false, nestDepth = 0) {

  // -------- New Folder -------- //

  if (!stats) stats = await stat(folderPath)

  const folder = { ...Folder }
  // folder.id = `folder-${stats.ino}`
  folder.name = folderPath.substring(folderPath.lastIndexOf('/') + 1)
  folder.path = folderPath
  folder.parentId = parentId
  folder.modified = stats.mtime.toISOString()
  folder.children = []
  folder.nestDepth = nestDepth

  const id = `folder-${stats.ino}`
  files.folders.byId[id] = folder
  files.folders.allIds.push(id)


  // -------- Contents -------- //

  // Get everything in directory with `readdir`.
  // Returns array of `fs.Dirent` objects.
  // https://nodejs.org/api/fs.html#fs_class_fs_dirent
  const everything = await readdir(folderPath, { withFileTypes: true })

  // if (!everything.length > 0) return contents
  // console.log(folder.name, "---")

  // everything.forEach(async (e) => {

  //   if (e.isFile()) {

  //     const ePath = path.join(folder.path, e.name)
  //     const ext = path.extname(e.name)
  //     const stats = await stat(ePath)

  //     if (ext == '.md' || ext == '.markdown') {
  //       folder.children.push(`doc-${stats.ino}`)
  //     }
  //   }
  // })

  await Promise.all(
    everything.map(async (e) => {

      // Get path by combining folderPath with file name.
      const ePath = path.join(folderPath, e.name)

      // Get extension
      const ext = path.extname(e.name)

      // Get stats
      const stats = await stat(ePath)

      if (e.isDirectory() && recursive) {

        const { folders, docs, media } = await mapFolder(files, ePath, stats, id, true, nestDepth + 1)

        // folder.directChildCount++
        // folder.recursiveChildCount++

        // for (const fldr in folders.byId) {
        //   folder.recursiveChildCount += folders.byId[fldr].directChildCount
        // }

        // folders.byId.forEach((f) => {
        //   folder.recursiveChildCount += f.directChildCount
        // })

      } else if (ext == '.md' || ext == '.markdown') {
        const doc = await mapDocument(ePath, stats, folder.id, nestDepth + 1)
        files.docs.byId[doc.id] = folder
        files.docs.allIds.push(doc.id)
        // folder.directChildCount++
        // folder.recursiveChildCount++

        // OLDER
        // contents.documents.push(doc)
        // folder.children.push(doc.id)

      } else if (imageFormats.includes(ext) || avFormats.includes(ext)) {

        const media = await mapMedia(ePath, stats, folder.id, ext, nestDepth + 1)
        files.media.byId[media.id] = folder
        files.media.allIds.push(media.id)
        // folder.directChildCount++
        // folder.recursiveChildCount++

        // OLDER
        // contents.media.push(media)
        // folder.children.push(media.id)
      }
    })
  )

  return files
}