import { readdir, readFile, pathExists, stat } from 'fs-extra'
import chokidar from 'chokidar'
import path from 'path'
import matter from 'gray-matter'
import removeMd from 'remove-markdown'

class ProjectDirectory {

  constructor() {
    this.store
    this.directory = ''
    // this.contents = []

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

    // Save local 1) reference to store, and 2) value of directory
    this.store = store
    this.directory = store.store.projectDirectory

    // Setup change listener for store
    this.store.onDidAnyChange((newState, oldState) => {
      this.onStoreChange(newState, oldState)
    })

    // Check if path is valid. 
    // If yes, map directory, update store, and add watcher.
    if (await this.isWorkingPath(this.directory)) {
      const contents = await this.mapDirectoryRecursively(this.directory)
      this.store.dispatch({ type: 'MAP_HIERARCHY', contents: contents })
      this.watcher.add(this.directory)
    }
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
        const contents = await this.mapDirectoryRecursively(newDir)
        this.store.dispatch({ type: 'MAP_HIERARCHY', contents: contents })
        this.watcher.add(newDir)
      } else {
        // Else, if it doesn't exist, tell store to `RESET_HIERARCHY` (clears to `[]`)
        this.store.dispatch({ type: 'RESET_HIERARCHY' })
      }
    }
  }

  /**
   * Populate this.contents with flat array of directory contents. One object for each directory and file found. Works recursively.
   * @param {*} directoryPath - Directory to look inside.
   * @param {*} parentObj - If passed in, we 1) get parent id, and 2) increment its directory counter (assuming the directory ). Is left undefined (default) for the top-level directory.
   */
  async mapDirectoryRecursively(directoryPath, parentId = undefined) {

    let arrayOfContents = []

    let contents = await readdir(directoryPath, { withFileTypes: true })

    // Filter contents to (not-empty) directories, and markdown files.
    contents = contents.filter((c) => c.isDirectory() || c.name.includes('.md'))

    // If the directory has no children we care about (.md files or directories), 
    // we return an empty array.
    if (contents.length == 0) {
      return arrayOfContents
    }

    // Get stats for directory
    const stats = await stat(directoryPath)

    // Create object for directory
    const thisDir = {
      type: 'directory',
      id: stats.ino,
      name: directoryPath.substring(directoryPath.lastIndexOf('/') + 1),
      path: directoryPath,
      modified: stats.mtime.toISOString(),
      childFileCount: 0,
      childDirectoryCount: 0
    }

    // If parentId was passed, set `thisDir.parentId` to it
    if (parentId !== undefined) {
      thisDir.parentId = parentId
    }

    for (let c of contents) {

      // Get path
      const cPath = path.join(directoryPath, c.name)

      if (c.isFile()) {
        // Increment file counter
        thisDir.childFileCount++

        // Push new file object
        arrayOfContents.push({
          type: 'file',
          name: c.name,
          path: cPath,
          parentId: thisDir.id
        })
      } else if (c.isDirectory()) {

        // Get child directory contents
        // If not empty, increment counter and push to arrayOfContents
        const subDirContents = await this.mapDirectoryRecursively(cPath, thisDir.id)
        if (subDirContents.length !== 0) {
          thisDir.childDirectoryCount++
          arrayOfContents = arrayOfContents.concat(subDirContents)
        }
      }
    }

    // Finally, if it is not empty, push thisDir to `arrayOfContents`
    if (arrayOfContents.length !== 0) {
      arrayOfContents.push(thisDir)
    }

    return arrayOfContents
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
            const md = matter(str, { excerpt: extractExcerpt })

            // Set fields from stats
            f.id = stats.ino
            f.modified = stats.mtime.toISOString()
            f.created = stats.birthtime.toISOString()
            f.excerpt = md.excerpt

            // Set fields from front matter (if it exists)
            // gray-matter `isEmpty` property returns "true if front-matter is empty".
            if (!f.isEmpty) {

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

function extractExcerpt(file) {

  // gray-matter passes extract function the file.
  // file.contents give us the input string, with front matter stripped.

  // Remove h1, if it exists. Then trim to 200 characters.
  let excerpt = file.content
    .replace(/^# (.*)\n/gm, '')
    .substring(0, 400)

  // Remove markdown formatting. Start with remove-markdown rules.
  // Per: https://github.com/stiang/remove-markdown/blob/master/index.js
  // Then add whatever additional changes I want (e.g. new lines).
  excerpt = removeMd(excerpt)
    .replace(/^> /gm, '')         // Block quotes
    .replace(/^\n/gm, '')         // New lines at start of line (usually doc)
    .replace(/\n/gm, ' ')         // New lines in-line (replace with spaces)
    .replace(/\t/gm, ' ')         // Artifact left from list replacement
    .replace(/\[@.*?\]/gm, '')    // Citations
    .replace(/:::.*?:::/gm, ' ')  // Bracketed spans
    .replace(/\s{2,}/gm, ' ')     // Extra spaces
    .substring(0, 200)            // Trim to 200 characters

  file.excerpt = excerpt
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
