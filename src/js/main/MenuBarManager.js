import { app, Menu, MenuItem, nativeTheme } from 'electron'
import { stateHasChanged } from '../shared/utils.js'
import { selectProjectDirectoryFromDialog } from './actions/index.js'
import { remove } from 'fs-extra'

/*
Main instantiates new MenuBarManager instance. 
Constructor creates variables, change listeners, and calls init().
*/

// I want to get values from Editor.svelte to editor
// Example I'll use: toggle source mode
// User selects `View > Source mode`
// Enabled == Is active project `panel.sourceMode` true?
// Dispatch command to reducer
// Reducer sets value to panel
// EditorPanel.svelte detects the change, and updates the `sourceMode` prop of Editor.svelte
// Editor.svelte, when value changes, tells editor.js

const isMac = process.platform === 'darwin'
let menu
let menuItems = {}

/**
 * On startup, create initial menu bar, and create change listeners.
 */

export function init() {

  // ------ SETUP CHANGE LISTENERS ------ //

  // We need to rebuild the menu whenever any of the follow change,
  // because they drive one or more menu items' `enabled` states.

  global.store.onDidAnyChange((state, oldState) => {

    const hasChanged = [
      // Focused window
      stateHasChanged(global.patches, "focusedWindowId"),
      // Focused panel
      stateHasChanged(global.patches, ["projects", "byId", "focusedPanelIndex"]),
      // Source mode
      stateHasChanged(global.patches, "sourceMode"),
      // Appearance
      stateHasChanged(global.patches, "theme"),
      stateHasChanged(global.patches, "chromium"),
    ]

    const anyOfTheAboveHaveChanged = hasChanged.includes(true)

    if (anyOfTheAboveHaveChanged) {
      Menu.setApplicationMenu(getMenu())
    }
  })

  // ------ DO INITIAL SETUP ------ //

  Menu.setApplicationMenu(getMenu())
}



/**
 * Return a populated electron Menu instance.
 */
function getMenu() {

  // Create a new electron Menu instance
  menu = new Menu()

  // Generate the menu iems
  menuItems = getMenuItems()

  // Append the menu items to the Menu
  menuItems.topLevel.forEach((item) => menu.append(item))

  return menu
}


function getFocusedProject() {
  const state = global.state()
  return state.projects.byId[state.focusedWindowId]
}

function getFocusedPanel() {
  const project = getFocusedProject()
  return project?.panels[project?.focusedPanelIndex]
}

/**
 * Return Menu Items. These are appended to a new Menu instance.
 */
function getMenuItems() {

  const state = global.state()
  const project = getFocusedProject()
  const panel = getFocusedPanel()

  const items = {
    topLevel: []
  }

  // Separator
  const _______________ = new MenuItem({ type: 'separator' })


  // -------- App (Mac-only) -------- //

  if (isMac) {
    items.topLevel.push(new MenuItem({
      label: app.name,
      submenu: [
        { role: 'about' },
        _______________,
        new MenuItem({
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          async click() {
            global.store.dispatch({ type: 'OPEN_PREFERENCES' })
          }
        }),
        _______________,
        { role: 'services', submenu: [] },
        _______________,
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        _______________,
        { role: 'quit' }
      ]
    }))
  }


  // -------- File (Mac-only) -------- //

  if (isMac) {

    items.closeEditor = new MenuItem({
      label: 'Close Editor',
      accelerator: 'CmdOrCtrl+W',
      enabled: panel !== undefined,
      click(item, focusedWindow) {

        // In dev mode, we can get into state where there's no focused window, and/or no project. I think it may happen when dev tools is open in a panel. Check before proceeding, or we'll get errors.
        if (!focusedWindow || !project) return

        // If there are multiple panels open, close the focused one. Else, close the project window.
        if (project.panels.length > 1) {
          global.store.dispatch({
            type: 'CLOSE_PANEL',
            panelIndex: project.focusedPanelIndex
          }, focusedWindow)
        } else {
          focusedWindow.close()
        }
      }
    })

    items.closeWindow = new MenuItem({
      label: 'Close Window',
      accelerator: 'CmdOrCtrl+Shift+W',
      enabled: panel !== undefined,
      click(item, focusedWindow) {
        focusedWindow.close()
      }
    })

    function isMoveToTrashEnabled() {
      const sideBarIsOpen = project?.sidebar.isOpen
      const selectedTab = project?.sidebar.tabsById[project?.sidebar.activeTabId]
      const fileIsSelectedInSidebar = selectedTab?.selected.length
      return sideBarIsOpen && fileIsSelectedInSidebar
    }

    items.moveToTrash = new MenuItem({
      label: 'Move to Trash',
      accelerator: 'CmdOrCtrl+Backspace',
      enabled: isMoveToTrashEnabled(),
      async click(item, focusedWindow) {

        // Get selected file paths
        const watcher = global.watchers.find((w) => w.id == focusedWindow.projectId)
        const project = getFocusedProject()
        const activeSidebarTab = project.sidebar.tabsById[project.sidebar.activeTabId]
        let filePathsToDelete = []
        activeSidebarTab.selected.forEach((id) => {
          const filepath = watcher.files.byId[id]?.path
          filePathsToDelete.push(filepath)
        })
        
        // Delete
        await Promise.all(
          filePathsToDelete.map(async (filepath) => {
            await remove(filepath)
          })
        )

        // focusedWindow.webContents.send('mainRequestsDeleteFile')
      }
    })

    items.newDocument = new MenuItem({
      label: 'New Document',
      accelerator: 'CmdOrCtrl+N',
      enabled: project !== undefined,
      async click(item, focusedWindow) {
        // TODO
        // global.store.dispatch(await newFile(state))
      }
    })

    items.newEditor = new MenuItem({
      label: 'New Editor',
      accelerator: 'CmdOrCtrl+T',
      enabled: project !== undefined,
      async click(item, focusedWindow) {
        // Create new panel to right of the current focused panel
        global.store.dispatch({
          type: 'OPEN_NEW_PANEL',
          docId: '',
          panelIndex: project.focusedPanelIndex + 1
        }, focusedWindow)
      }
    })

    items.newWindow = new MenuItem({
      label: 'New Window',
      accelerator: 'CmdOrCtrl+Shift+N',
      async click(item, focusedWindow) {
        global.store.dispatch({ type: 'CREATE_NEW_PROJECT' })
      }
    })

    items.openProject = new MenuItem({
      label: 'Open Project...',
      accelerator: 'CmdOrCtrl+Shift+O',
      enabled: project !== undefined,
      async click(item, focusedWindow) {
        global.store.dispatch(await selectProjectDirectoryFromDialog(), focusedWindow)
      }
    })

    items.save = new MenuItem({
      label: 'Save',
      accelerator: 'CmdOrCtrl+S',
      enabled: project !== undefined,
      click(item, focusedWindow) {
        if (getFocusedPanel().unsavedChanges) {
          focusedWindow.webContents.send('mainRequestsSaveFocusedPanel')
        }
      }
    })

    items.saveAll = new MenuItem({
      label: 'Save All',
      accelerator: 'CmdOrCtrl+Alt+S',
      enabled: panel !== undefined,
      click(item, focusedWindow) {
        focusedWindow.webContents.send('mainRequestsSaveAll')
      }
    })

    items.topLevel.push(new MenuItem({
      label: 'File',
      submenu: [
        items.newDocument,
        items.newEditor,
        items.newWindow,
        _______________,
        items.openProject,
        _______________,
        items.save,
        items.saveAll,
        items.moveToTrash,
        _______________,
        items.closeEditor,
        items.closeWindow
      ]
    }))
  }


  // -------- Edit -------- //


  // mI.startspeaking = new MenuItem({ role: 'startspeaking' })
  // mI.stopspeaking = new MenuItem({ role: 'stopspeaking' })

  items.findInFiles = new MenuItem({
    label: 'Find in Files',
    accelerator: 'CmdOrCtrl+Shift+F',
    enabled: project !== undefined,
    click(item, focusedWindow) {
      // focusedWindow.webContents.send('findInFiles')
    }
  })

  items.replaceInFiles = new MenuItem({
    label: 'Replace in Files',
    accelerator: 'CmdOrCtrl+Shift+H',
    enabled: project !== undefined,
    click(item, focusedWindow) {
      // focusedWindow.webContents.send('findInFiles')
    }
  })

  items.topLevel.push(new MenuItem(
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        _______________,
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' },
        _______________,
        items.findInFiles,
        items.replaceInFiles,
        // If macOS, add speech options to Edit menu
        ...isMac ? [
          _______________,
          {
            label: 'Speech',
            submenu: [
              { role: 'startspeaking' },
              { role: 'stopspeaking' }
            ]
          }
        ] : []
      ]
    }
  ))


  // -------- View -------- //

  items.themeDark = new MenuItem({
    label: 'Dark',
    type: 'checkbox',
    checked: state.theme.app == 'dark',
    click() {
      store.dispatch({
        type: 'SET_APP_THEME',
        theme: 'dark',
      })
    }
  })

  items.themeLight = new MenuItem({
    label: 'Light',
    type: 'checkbox',
    checked: state.theme.app == 'light',
    click() {
      store.dispatch({
        type: 'SET_APP_THEME',
        theme: 'light',
      })
    }
  })

  items.themeMatchSystem = new MenuItem({
    label: 'Match System',
    type: 'checkbox',
    checked: state.theme.app == 'match-system',
    click() {
      store.dispatch({
        type: 'SET_APP_THEME',
        theme: 'match-system',
      })
    }
  })

  items.sourceMode = new MenuItem({
    label: 'Source mode',
    type: 'checkbox',
    checked: state.sourceMode,
    accelerator: 'CmdOrCtrl+/',
    click(item, focusedWindow) {
      if (focusedWindow) {
        global.store.dispatch({
          type: 'SET_SOURCE_MODE',
          enabled: !global.state().sourceMode,
        }, focusedWindow)
      }
    }
  })

  items.toggleDevTools = new MenuItem({
    label: 'Toggle Developer Tools',
    accelerator: isMac ? 'Alt+Command+I' : 'Ctrl+Shift+I',
    role: 'toggleDevTools',
  })

  items.reload = new MenuItem({
    label: 'Reload',
    accelerator: 'CmdOrCtrl+R',
    role: 'reload'
  })

  items.topLevel.push(new MenuItem({
    label: 'View',
    submenu: [
      {
        label: 'Appearance',
        submenu: [
          items.themeMatchSystem,
          _______________,
          items.themeLight,
          items.themeDark
        ]
      },
      _______________,
      items.sourceMode,
      ...app.isPackaged ? [] : [
        _______________,
        items.toggleDevTools, 
        items.reload
      ],
    ]
  }))

  return items
}

