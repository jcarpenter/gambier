import { readdir, readFile, pathExists, stat } from 'fs-extra'
import chokidar from 'chokidar'
import path from 'path'

class ProjectDirectory {

  constructor() {
    this.store
    this.directory = ''

    this.watcher = chokidar.watch('', {
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 50
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
    
    // Check if path is valid
    if (await this.isWorkingPath(this.directory)) {
      this.mapProjectHierarchy(this.directory)
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

      // If the new directory exists, we map it and watch it
      if (await this.isWorkingPath(newDir)) {
        this.mapProjectHierarchy(newDir)
        this.watcher.add(newDir)
      } else {
        // Else, if it doesn't exist, we reset the hierarchy (clear contents)
        this.store.dispatch({ type: 'RESET_HIERARCHY' })
      }
    }
  }

  async mapProjectHierarchy(directory) {

    let name = directory.substring(directory.lastIndexOf('/') + 1)

    let contents = await getDirectoryContents(new Directory(name, directory))

    this.store.dispatch({ type: 'UPDATE_HIERARCHY', contents: [contents] })
  }
}


// -------- Project directory -------- //

function Directory(name, path, children = []) {
  this.typeOf = 'Directory'
  this.name = name
  this.path = path
  this.children = children
}

function File(name, path, created, modified) {
  this.typeOf = 'File'
  this.name = name
  this.path = path
  this.created = created
  this.modified = modified
}

async function getDirectoryContents(directoryObject) {

  let directoryPath = directoryObject.path

  let contents = await readdir(directoryPath, { withFileTypes: true })

  // Remove .DS_Store files
  contents = contents.filter((c) => c.name !== '.DS_Store')

  for (let c of contents) {
    if (c.isDirectory()) {
      const subPath = path.join(directoryPath, c.name)
      const subDir = new Directory(c.name, subPath)
      const subDirContents = await getDirectoryContents(subDir)
      const hasFilesWeCareAbout = subDirContents.children.find((s) => s.name.includes('.md')) == undefined ? false : true
      if (hasFilesWeCareAbout)
        directoryObject.children.push(subDirContents)
    } else if (c.name.includes('.md')) {
      const filePath = path.join(directoryPath, c.name)
      const stats = await stat(filePath)
      const created = stats.birthtime.toISOString()
      const modified = stats.mtime.toISOString()
      let file = new File(c.name, filePath, created, modified)
      directoryObject.children.push(file)
    }
  }
  return directoryObject
}

export const projectDirectory = new ProjectDirectory()