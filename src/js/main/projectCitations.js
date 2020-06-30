import { readdir, readFile, stat } from 'fs-extra'
import chokidar from 'chokidar'
import path from 'path'
import colors from 'colors'

class ProjectCitations {
  constructor() {
    this.store
    this.watcher
    this.citationsPath = ''
  }

  async setup(store) {
    // console.log("projectCitations: setup".bgRed)
    this.citationsPath = store.store.projectCitations
    // console.log(this.citationsPath.bgRed)
  }

  startWatching() {
    // console.log("projectCitations: startWatching".bgRed)
    this.watcher = chokidar.watch(this.citationsPath, {
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 400,
        pollInterval: 200
      }
    })

    this.watcher.on('all', (event, path) => {
      // console.log("startWatching: this.watcher.on".bgRed)
      console.log(event)
      console.log(path)
      this.onCitationsEvent()
    })
  }

  onCitationsEvent() {
    // console.log("projectCitations: onCitationsEvent".bgRed)
  }

  getCitations() {
    return "Some citations for you to enjoy"
  }
}

export const projectCitations = new ProjectCitations()