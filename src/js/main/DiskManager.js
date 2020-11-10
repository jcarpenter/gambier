import { BrowserWindow } from 'electron'
import { hasChangedTo } from '../shared/utils'
import { Watcher } from './watcher/Watcher'


// -------- DISK MANAGER -------- //

export class DiskManager {
	constructor() {

		// Listen for state changes
		global.store.onDidAnyChange((state, oldState) => {

			const isStartingUp = hasChangedTo('appStatus', 'coldStarting', state, oldState)
			const projectAdded = state.projects.length > oldState.projects.length
			const projectRemoved = state.projects.length < oldState.projects.length

			if (isStartingUp) {
				state.projects.forEach((p, index) => {
					// Create Watcher and add to `watchers` array
					const watcher = new Watcher(p)
					this.watchers.push(watcher)
				})
			} else if (projectAdded) {
				// Get new project. Then create Watcher and add to `watchers` array
				const project = state.projects[state.projects.length - 1]
				const watcher = new Watcher(project)
				this.watchers.push(watcher)
			} else if (projectRemoved) {
				// Remove the matching watcher. Do so by comparing projects and watchers. Find the watcher who does not have a corresponding project, by comparing IDs, then remove it.
			}
		})
	}

	// Array of Watcher instances.
	watchers = []
}
