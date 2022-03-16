
import { app, MenuItem } from "electron";
import { ______________________________ } from './Separator.js'

const isMac = process.platform === 'darwin'

export function create() {

  return new MenuItem({
    label: 'View',
    submenu: [

      new MenuItem({
        label: 'Source mode',
        id: 'view-sourceMode',
        type: 'checkbox',
        accelerator: 'CmdOrCtrl+/',
        click(item, focusedWindow) {
          if (focusedWindow) {
            global.store.dispatch({
              type: 'SET_SOURCE_MODE',
              enabled: !global.state().sourceMode,
            }, focusedWindow)
          }
        }
      }),

      ______________________________,

      new MenuItem({
        label: 'Sidebar',
        id: 'view-sidebar',
        type: 'checkbox',
        accelerator: 'CmdOrCtrl+Alt+B',
        click(item, focusedWindow) {
          const state = global.state()
          const project = state.projects.byId[state.focusedWindowId]
          global.store.dispatch({
            type: 'SIDEBAR_SET_OPEN_CLOSED',
            value: !project.sidebar.isOpen
          }, focusedWindow)
        }
      }),

      ______________________________,

      new MenuItem({
        label: 'Project',
        id: 'view-project',
        type: 'checkbox',
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
        id: 'view-allDocs',
        type: 'checkbox',
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
        id: 'view-mostRecent',
        type: 'checkbox',
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
        id: 'view-tags',
        type: 'checkbox',
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
        id: 'view-media',
        type: 'checkbox',
        accelerator: 'Cmd+5',
        click(item, focusedWindow) {
          global.store.dispatch({
            type: 'SELECT_SIDEBAR_TAB_BY_ID',
            id: 'media'
          }, focusedWindow)
        }
      }),

      // new MenuItem({
      //   label: 'Citations',
      //   id: 'view-citations',
      //   type: 'checkbox',
      //   accelerator: 'Cmd+6',
      //   click(item, focusedWindow) {
      //     global.store.dispatch({
      //       type: 'SELECT_SIDEBAR_TAB_BY_ID',
      //       id: 'citations'
      //     }, focusedWindow)
      //   }
      // }),

      new MenuItem({
        label: 'Search',
        id: 'view-search',
        type: 'checkbox',
        accelerator: 'Cmd+6',
        click(item, focusedWindow) {
          global.store.dispatch({
            type: 'SELECT_SIDEBAR_TAB_BY_ID',
            id: 'search'
          }, focusedWindow)
        }
      }),

      ______________________________,

      new MenuItem({
        label: 'Font Size',
        submenu: [
          new MenuItem({
            label: 'Default',
            id: 'view-fontsize-default',
            accelerator: 'CmdOrCtrl+0',
            click() {
              global.store.dispatch({ 
                type: 'SET_EDITOR_FONT_SIZE', 
                value: global.state().editorFont.default
              })
            }
          }),
          ______________________________,
          new MenuItem({
            label: 'Increase',
            id: 'view-fontsize-increase',
            accelerator: 'CmdOrCtrl+=',
            click() {
              global.store.dispatch({ type: 'INCREASE_EDITOR_FONT_SIZE' })
            }
          }),
          new MenuItem({
            label: 'Decrease',
            id: 'view-fontsize-decrease',
            accelerator: 'CmdOrCtrl+-',
            click() {
              global.store.dispatch({ type: 'DECREASE_EDITOR_FONT_SIZE' })
            }
          })
        ]
      }),

      new MenuItem({
        label: 'Line Height',
        submenu: [
          new MenuItem({
            label: 'Default',
            id: 'view-lineheight-default',
            accelerator: 'CmdOrCtrl+Alt+0',
            click() {
              global.store.dispatch({ type: 'SET_DEFAULT_EDITOR_LINE_HEIGHT' })
            }
          }),
          ______________________________,
          new MenuItem({
            label: 'Increase',
            id: 'view-lineheight-increase',
            accelerator: 'CmdOrCtrl+Alt+=',
            click() {
              global.store.dispatch({ type: 'INCREASE_EDITOR_LINE_HEIGHT' })
            }
          }),
          new MenuItem({
            label: 'Decrease',
            id: 'view-lineheight-decrease',
            accelerator: 'CmdOrCtrl+Alt+-',
            click() {
              global.store.dispatch({ type: 'DECREASE_EDITOR_LINE_HEIGHT' })
            }
          })
        ]
      }),

      // TODO: Am hiding these commands for now, because of Electron bug.
      // Labels are incorrect if accelerator uses Shift and `-` or `=` 
      // keys. For example, `Cmd+Shift+0` accelerator should display 
      // as `⇪⌘0`. Instead it’s `⌘)`. Will expose in Prefs instead.

      // new MenuItem({
      //   label: 'Line Height',
      //   submenu: [
      //     new MenuItem({
      //       label: 'Default',
      //       id: 'view-lineheight-default',
      //       accelerator: 'CmdOrCtrl+Shift+0',
      //       click() {
      //         global.store.dispatch({ type: 'SET_DEFAULT_EDITOR_LINE_HEIGHT' })
      //       }
      //     }),
      //     ______________________________,
      //     new MenuItem({
      //       label: 'Increase',
      //       id: 'view-lineheight-increase',
      //       accelerator: 'CmdOrCtrl+Shift+=',
      //       click() {
      //         global.store.dispatch({ type: 'INCREASE_EDITOR_LINE_HEIGHT' })
      //       }
      //     }),
      //     new MenuItem({
      //       label: 'Decrease',
      //       id: 'view-lineheight-decrease',
      //       accelerator: 'CmdOrCtrl+Shift+-',
      //       click() {
      //         global.store.dispatch({ type: 'DECREASE_EDITOR_LINE_HEIGHT' })
      //       }
      //     })
      //   ]
      // }),

      ______________________________,

      new MenuItem({
        label: 'Dark Mode',
        submenu: [
          new MenuItem({
            label: 'Match System',
            type: 'checkbox',
            checked: global.state().darkMode == 'match-system',
            click() {
              global.store.dispatch({ type: 'SET_DARK_MODE', value: 'match-system', })
            }
          }),
          ______________________________,
          new MenuItem({
            label: 'Dark',
            type: 'checkbox',
            checked: global.state().darkMode == 'dark',
            click() {
              global.store.dispatch({ type: 'SET_DARK_MODE', value: 'dark' })
            }
          }),
          new MenuItem({
            label: 'Light',
            type: 'checkbox',
            checked: global.state().darkMode == 'light',
            click() {
              global.store.dispatch({ type: 'SET_DARK_MODE', value: 'light' })
            }
          })
        ]
      }),

      new MenuItem({
        label: 'Theme',
        id: 'view-theme',
        submenu: global.state().theme.installed.map(({ name, id }) => {
          return new MenuItem({
            label: name,
            id: `view-theme-${id}`,
            type: 'checkbox',
            checked: global.state().theme.id == id,
            click(item) {
              if (!item.checked) {
                global.store.dispatch({ type: 'SET_THEME', name: id })
              }
            }
          })
        })
      }),

      ...app.isPackaged ? [] : [
        ______________________________,
        new MenuItem({
          label: 'Developer',
          submenu: [
            new MenuItem({
              label: 'Toggle Developer Tools',
              accelerator: isMac ? 'Alt+Command+I' : 'Ctrl+Shift+I',
              role: 'toggleDevTools',
            }),
            new MenuItem({
              label: 'Reload',
              accelerator: 'CmdOrCtrl+R',
              role: 'reload'
            }),
            new MenuItem({
              label: 'Toggle Grid',
              accelerator: 'CmdOrCtrl+Alt+G',
              click() {
                global.store.dispatch({ 
                  type: 'SET_DEVELOPER_OPTIONS', 
                  options: {
                    ...global.state().developer, 
                    showGrid: !global.state().developer.showGrid
                  }
                })
              }
            })
          ]
        })
      ],

    ]
  })
}



export function update(appMenu) {

  const m = appMenu
  const state = global.state()
  const project = state.projects.byId[state.focusedWindowId]
  const panel = project?.panels[project?.focusedPanelIndex]
  const prefsIsFocused = state.focusedWindowId == 'preferences'

  m.getMenuItemById('view-sourceMode').checked = state.sourceMode

  const sidebarTabs = ['project', 'allDocs', 'mostRecent', 'tags', 'media', 'search']
  sidebarTabs.forEach((id) => {
    const item = m.getMenuItemById(`view-${id}`)
    item.enabled = project !== undefined
    item.checked = project?.sidebar.activeTabId == id
  })

  // View > Theme submenu: set `checked`
  m.getMenuItemById('view-theme').submenu.items.forEach((item) => {
    const id = item.id.replace('view-theme-', '')
    item.checked = id == state.theme.id
  })

  m.getMenuItemById('view-fontsize-increase').enabled = state.editorFont.size < state.editorFont.max
  m.getMenuItemById('view-fontsize-decrease').enabled = state.editorFont.size > state.editorFont.min
  
  m.getMenuItemById('view-sidebar').checked = project?.sidebar.isOpen

  // m.getMenuItemById('view-lineheight-increase').enabled = state.editorLineHeight.size < state.editorLineHeight.max
  // m.getMenuItemById('view-lineheight-decrease').enabled = state.editorLineHeight.size > state.editorLineHeight.min

}

export function onStateChanged(state, oldState, project, panel, prefsIsFocused, appMenu) {

  if (state.appStatus == 'coldStarting') {
    update()
    return
  }

  const oldProject = oldState.projects.byId[oldState.focusedWindowId]

  const changes = [
    state.focusedWindowId !== oldState.focusedWindowId,
    state.theme.id !== oldState.theme.id,
    state.sourceMode !== oldState.sourceMode,
    state.editorFont.size !== oldState.editorFont.size,
    state.editorLineHeight.size !== oldState.editorLineHeight.size,
    project?.sidebar.activeTabId !== oldProject?.sidebar.activeTabId,
    project?.sidebar.isOpen !== oldProject?.sidebar.isOpen
  ]

  if (changes.includes(true)) {
    update(appMenu)
  }
}