import { readdir, readFile, pathExists, stat } from 'fs-extra'
import chokidar from 'chokidar'
import path from 'path'
import matter from 'gray-matter'
// import directoryTree from 'directory-tree'
// import { createFlatHierarchy } from 'hierarchy-js'

class ProjectDirectory {

  constructor() {
    this.store
    this.directory = ''
    this.contents = []

    this.watcher = chokidar.watch('', {
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 400,
        pollInterval: 200
      }
    })

    this.watcher.on('all', (event, path) => {
      console.log('- - - - - - - -')
      console.log(event)
      console.log(path)
      // this.mapProjectHierarchy(this.directory)
    })
  }

  async setup(store) {

    this.store = store
    this.directory = store.store.projectDirectory

    // Check if path is valid. 
    // If yes, map directory, update store, and add watcher.
    if (await this.isWorkingPath(this.directory)) {
      await this.mapProjectContentsAsFlatArray(this.directory)
      this.store.dispatch({ type: 'MAP_HIERARCHY', contents: this.contents })
      this.watcher.add(this.directory)
    }

    // Setup change listener for store
    this.store.onDidAnyChange((newState, oldState) => {
      this.onStoreChange(newState, oldState)
    })
  }

  async isWorkingPath(directory) {

    if (directory == 'undefined') {
      return false
    } else {
      if (await pathExists(directory)) {
        return true
      } else {
        return false
      }
    }
  }

  async onStoreChange(newState, oldState) {

    let newDir = newState.projectDirectory
    let oldDir = oldState.projectDirectory
    
    // We update the local saved directory value
    this.directory = newDir

    // If the directory has changed...
    if (newDir !== oldDir) {

      // We unwatch the old directory (if it wasn't undefined)
      if (oldDir !== 'undefined') this.watcher.unwatch(oldDir)

      // Check if path is valid. 
      // If yes, map directory, update store, and add watcher.
      if (await this.isWorkingPath(newDir)) {
        await this.mapProjectContentsAsFlatArray(newDir)
        this.store.dispatch({ type: 'MAP_HIERARCHY', contents: this.contents })
        this.watcher.add(newDir)
      } else {
        // Else, if it doesn't exist, tell store to `RESET_HIERARCHY` (clears to `[]`)
        this.store.dispatch({ type: 'RESET_HIERARCHY' })
      }
    }
  }

  async mapProjectContentsAsFlatArray(directoryPath) {

    // const obj = { contents: [] }
    this.contents = []
    await this.mapDirectoryRecursively(directoryPath)
    await this.getFilesDetails()
  }

  /**
   * Populate this.contents with flat array of directory contents. One object for each directory and file found. Works recursively.
   * @param {*} directoryPath - Directory to look inside.
   * @param {*} parentId - Left undefined (default) for top-level directory.
   */
  async mapDirectoryRecursively(directoryPath, parentId = undefined) {

    let contents = await readdir(directoryPath, { withFileTypes: true })

    // Filter contents to (not-empty) directories, and markdown files.
    contents = contents.filter((c) => c.isDirectory() || c.name.includes('.md'))
    if (contents.length == 0) return

    // Get stats for directory
    const stats = await stat(directoryPath)

    // Create object for directory
    const thisDir = {
      type: 'directory',
      id: stats.ino,
      name: directoryPath.substring(directoryPath.lastIndexOf('/') + 1),
      path: directoryPath,
      modified: stats.mtime.toISOString(),
      children: 0
    }

    // If parentId argument was set, apply it to thisDir
    if (parentId !== undefined) thisDir.parentId = parentId

    for (let c of contents) {

      // Increment children counter
      thisDir.children++

      // Get path
      const cPath = path.join(directoryPath, c.name)

      if (c.isFile()) {
        
        // Push new file object
        this.contents.push({
          type: 'file',
          name: c.name,
          path: cPath,
          parentId: thisDir.id
        })
      } else if (c.isDirectory()) {

        // Map child directory
        await this.mapDirectoryRecursively(cPath, thisDir.id)
      }

    }

    // Finally, push this directory to `this.contents`
    this.contents.push(thisDir)
  }

  /**
   * Go through each file in `this.contents` and add details loaded from stats (e.g. created) and gray-matter (e.g. excerpt, tags, title). We use Promise.all() to run this in parallel, so we're processing files in a batch, instead of sequentially one-by-one.
   */
  async getFilesDetails() {

    await Promise.all(
      this.contents.map(async (f) => {
        
        // Ignore directories
        if (f.type == 'file') {

          // Return a promise ()
          return readFile(f.path, 'utf8').then(async str => {
            
            // Get stats
            const stats = await stat(f.path)
            
            // Get front matter
            const md = matter(str, { excerpt: true })
            const hasFrontMatter = md.hasOwnProperty('data')
            
            // Set fields from stats
            f.id = stats.ino
            f.modified = stats.mtime.toISOString()
            f.created = stats.birthtime.toISOString()

            // Set fields from front matter (if it exists)
            if (hasFrontMatter) {

              // If `tags` exists in front matter, use it. Else, set as empty `[]`.
              f.tags = md.data.hasOwnProperty('tags') ? md.data.tags : []

              // If title exists in front matter, use it. Else, use name, minus extension.
              if (md.data.hasOwnProperty('title')) {
                f.title = md.data.title
              } else {
                f.title = f.name.slice(0, f.name.lastIndexOf('.'))
              }
            }
          })
        }
      })
    )
  }
}

export const projectDirectory = new ProjectDirectory()


















// // -------- Project directory -------- //

// function Directory(name, path, children = []) {
//   this.typeOf = 'Directory'
//   this.name = name
//   this.path = path
//   this.children = children
// }

// function File(title, excerpt, path, created, modified) {
//   this.typeOf = 'File'
//   this.title = title
//   this.excerpt = excerpt
//   this.path = path
//   this.created = created
//   this.modified = modified
// }

// async function getDirectoryContents(directoryObject) {

//   let directoryPath = directoryObject.path

//   let contents = await readdir(directoryPath, { withFileTypes: true })

//   // Remove .DS_Store files
//   contents = contents.filter((c) => c.name !== '.DS_Store')

//   for (let c of contents) {
//     if (c.isDirectory()) {
//       // console.log("--------------")
//       // console.log(c.name)
//       const subPath = path.join(directoryPath, c.name)
//       const subDir = new Directory(c.name, subPath)
//       const subDirContents = await getDirectoryContents(subDir)
//       const hasFilesWeCareAbout = subDirContents.children.find((s) => s.name.includes('.md')) == undefined ? false : true
//       if (hasFilesWeCareAbout)
//         directoryObject.children.push(subDirContents)
//     } else if (c.name.includes('.md')) {

//       // console.log(`> ${c.name}`)
//       const filePath = path.join(directoryPath, c.name)

//       // Get title (and other front matter), contents and excerpt
//       const md = matter.read(filePath, { excerpt: true })

//       const hasFrontMatter = md.hasOwnProperty("data")
//       console.log(hasFrontMatter)

//       // Get created and modified times
//       const stats = await stat(filePath)
//       const created = stats.birthtime.toISOString()
//       const modified = stats.mtime.toISOString()

//       let file = new File(c.name, "Excerpt", filePath, created, modified)
//       directoryObject.children.push(file)
//     }
//   }
//   return directoryObject
// }
