import { MenuItem } from "electron";
import { ______________________________ } from './Separator.js'

export const menu = new MenuItem({
  label: 'View',
  submenu: [

    new MenuItem({
      label: 'Project',
      accelerator: 'Cmd+1',
      click(item, focusedWindow) {
        global.store.dispatch({
          type: 'SELECT_SIDEBAR_TAB_BY_ID',
          id: 'project'
        }, focusedWindow)
      }
    }),

    new MenuItem({
      label: 'Documents',
      accelerator: 'Cmd+2',
      click(item, focusedWindow) {
        global.store.dispatch({
          type: 'SELECT_SIDEBAR_TAB_BY_ID',
          id: 'allDocs'
        }, focusedWindow)
      }
    }),

    new MenuItem({
      label: 'Most Recent',
      accelerator: 'Cmd+3',
      click(item, focusedWindow) {
        global.store.dispatch({
          type: 'SELECT_SIDEBAR_TAB_BY_ID',
          id: 'mostRecent'
        }, focusedWindow)
      }
    }),

    new MenuItem({
      label: 'Tags',
      accelerator: 'Cmd+4',
      click(item, focusedWindow) {
        global.store.dispatch({
          type: 'SELECT_SIDEBAR_TAB_BY_ID',
          id: 'tags'
        }, focusedWindow)
      }
    }),

    new MenuItem({
      label: 'Media',
      accelerator: 'Cmd+5',
      click(item, focusedWindow) {
        global.store.dispatch({
          type: 'SELECT_SIDEBAR_TAB_BY_ID',
          id: 'media'
        }, focusedWindow)
      }
    }),

    new MenuItem({
      label: 'Citations',
      accelerator: 'Cmd+6',
      click(item, focusedWindow) {
        global.store.dispatch({
          type: 'SELECT_SIDEBAR_TAB_BY_ID',
          id: 'citations'
        }, focusedWindow)
      }
    }),

    new MenuItem({
      label: 'Search',
      accelerator: 'Cmd+7',
      click(item, focusedWindow) {
        global.store.dispatch({
          type: 'SELECT_SIDEBAR_TAB_BY_ID',
          id: 'search'
        }, focusedWindow)
      }
    }),

  ]
})


export function update(applicationMenu) {
  // const m = applicationMenu
  // const state = global.state()
  // const project = state.projects.byId[state.focusedWindowId]
  // const panel = project?.panels[project?.focusedPanelIndex]
  // const prefsIsFocused = state.focusedWindowId == 'preferences'

}

export function onStateChanged(state, oldState, project, panel, prefsIsFocused, applicationMenu) {
  // update(applicationMenu)
}