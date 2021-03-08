import { BrowserWindow } from 'electron'
import { stateHasChanged } from '../shared/utils'
import { Watcher } from './watcher/Watcher'

// Array of Watcher instances.
export let watchers = []

/**
 * On startup, create a Watcher instance for each project. If a project does not yet have a valid directory, the Watcher instance will wait and watch for store changes, and start itself when a directory is assigned.
 */
export async function init() {

	let index = 0

	// Create a watcher for each project
	for (const project of global.state().projects) {
		const watcher = new Watcher(project)
		watchers.push(watcher)
	}

	// Listen for state changes
	/*
		- Is it cold start?
			- If yes, try to 
		- Has a directory changed?
			- If yes, for that project, does a Watcher already exist?
				- If yes, update the Watcher.
					- TODO
			- If no, is the new directory path valid?
				- If yes, create Watcher and pass in project
				- If no, do nothing
	*/
	global.store.onDidAnyChange((state, oldState) => {

		if (state.appStatus !== 'open') return
		// const isColdStart = propHasChangedTo('appStatus', 'coldStarting', state, oldState)
		// const isColdStart = stateHasChanged(global.patches, ['appStatus', 'coldStarting'])
		const projectDirectoryChanged = stateHasChanged(global.patches, ['projects', 'directory'])
		const projectAdded = state.projects.length > oldState.projects.length
		const projectRemoved = state.projects.length < oldState.projects.length

		// if (isColdStart) {

		// 	// For each project with a valid directory, create a watcher
		// 	state.projects.forEach((project) => {
		// 		if (project.directory) {
		// 			// Create Watcher and add to `watchers` array
		// 			const watcher = new Watcher(project)
		// 			this.watchers.push(watcher)
		// 		}
		// 	})
		// } else 
		// if (projectDirectoryChanged) {

		// 	// Create array of projects whose directories have changed
		// 	// First filter patches to those with directory changes
		// 	// Then get the associated projects from `state.projects`
		// 	const projectsWithNewDirectories = global.patches.filter((patch) => {
		// 		const pathAsString = patch.path.toString()
		// 		const dirHasChanged =
		// 			pathAsString.includes('projects') &&
		// 			pathAsString.includes('directory')
		// 		return dirHasChanged
		// 	}).map((patch) => {
		// 		// Format of patch path will be:
		// 		// `path: [ 'projects', 0, 'directory' ],`
		// 		// The project index is the integer (always second value).
		// 		const projectIndex = patch.path[1] //
		// 		const project = state.projects[projectIndex]
		// 		return project
		// 	})

		// 	projectsWithNewDirectories.forEach((project) => {
		// 		// Does corresponding watcher exist?
		// 		const watcher = global.watchers.find(({ id }) => id == project.id)

		// 		// If yes, update it. Else, create one.
		// 		if (watcher) {
		// 			console.log("TODO: Update watcher!!")
		// 		} else {
		// 			const watcher = new Watcher(project)
		// 			this.watchers.push(watcher)
		// 		}
		// 	})

		// } else if (projectAdded) {
		// 	// Get new project. Then create Watcher and add to `watchers` array
		// 	const project = state.projects[state.projects.length - 1]
		// 	const watcher = new Watcher(project)
		// 	this.watchers.push(watcher)
		// } else if (projectRemoved) {
		// 	// Remove the matching watcher. Do so by comparing projects and watchers. Find the watcher who does not have a corresponding project, by comparing IDs, then remove it.
		// }
	})
}
