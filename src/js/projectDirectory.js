class ProjectDirectory {

  constructor() {
    this.oldState = {}
  }

  setup(store) {
    store.onDidAnyChange((state) => this.handleChange(state))
  }

  handleChange(state) {
        
    if (state.projectDirectory !== this.oldState.projectDirectory) {
      console.log("Project directory has changed")
    } else {
      console.log("Project directory has --NOT-- changed")
    }

    this.oldState = state
  }
}

/*
If projectDirectory has changed:
  If projectDirectory === undefined
    Stop watching
    Reset store.hierarchy to default
  Else
    Scan project directory
*/

async function scan(newValue, oldValue) {

  if (store.get('projectDirectory') === 'undefined') return

  const dir = store.get('projectDirectory')
  const exists = await pathExists(dir)
  if (!exists) return
  updateHierarchy()
  watch(dir)
}

function watch(directory) {
  const watcher = chokidar.watch(directory, {
    ignored: /(^|[\/\\])\../, // Ignore dotfiles
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 50
    }
  })

  watcher.on('all', (event, path) => {
    updateHierarchy()
  })
}

async function updateHierarchy() {
  store.reset('hierarchy')

  let path = store.get('projectDirectory')
  let name = path.substring(path.lastIndexOf('/') + 1)

  let contents = await getDirectoryContents(new Directory(name, path))

  store.set('hierarchy', [contents])
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