import { MenuItem } from "electron";
import { ______________________________ } from './Separator.js'

export const menu = new MenuItem({
  label: 'Format',
  submenu: [

    new MenuItem({
      label: 'Heading',
      id: 'format-heading',
      accelerator: 'Cmd+Shift+H',
      // registerAccelerator: false,
      click(item, focusedWindow) {
        focusedWindow.webContents.send('setFormat', 'heading')
      }
    }),

    new MenuItem({
      label: 'Strong',
      id: 'format-strong',
      accelerator: 'Cmd+B',
      // registerAccelerator: false,
      click(item, focusedWindow) {
        focusedWindow.webContents.send('setFormat', 'strong')
      }
    }),

    new MenuItem({
      label: 'Emphasis',
      id: 'format-emphasis',
      accelerator: 'Cmd+I',
      // registerAccelerator: false,
      click(item, focusedWindow) {
        focusedWindow.webContents.send('setFormat', 'emphasis')
      }
    }),

    new MenuItem({
      label: 'Code',
      id: 'format-code',
      // accelerator: 'Cmd+I',
      // registerAccelerator: false,
      click(item, focusedWindow) {
        focusedWindow.webContents.send('setFormat', 'code')
      }
    }),

    ______________________________,

    new MenuItem({
      label: 'Link',
      id: 'format-link',
      accelerator: 'Cmd+K',
      click(item, focusedWindow) {
        focusedWindow.webContents.send('setFormat', 'link')
      }
    }),

    new MenuItem({
      label: 'Image',
      id: 'format-image',
      accelerator: 'Cmd+G',
      click(item, focusedWindow) {
        focusedWindow.webContents.send('setFormat', 'image')
      }
    }),

    new MenuItem({
      label: 'Footnote',
      id: 'format-footnote',
      accelerator: 'Cmd+Alt+T', // TODO: Figure something better
      click(item, focusedWindow) {
        focusedWindow.webContents.send('setFormat', 'footnote')
      }
    }),

    new MenuItem({
      label: 'Citation',
      id: 'format-citation',
      accelerator: 'Cmd+Shift+C',
      click(item, focusedWindow) {
        focusedWindow.webContents.send('setFormat', 'citation')
      }
    }),

    ______________________________,

    new MenuItem({
      label: 'Unordered List',
      id: 'format-ul',
      accelerator: 'Cmd+Shift+L',
      click(item, focusedWindow) {
        focusedWindow.webContents.send('setFormat', 'ul')
      }
    }),

    new MenuItem({
      label: 'Ordererd List',
      id: 'format-ol',
      accelerator: 'Cmd+Alt+L',
      click(item, focusedWindow) {
        focusedWindow.webContents.send('setFormat', 'ol')
      }
    }),

    ______________________________,

    new MenuItem({
      label: 'Task List',
      id: 'format-taskList',
      accelerator: 'Cmd+Shift+T',
      click(item, focusedWindow) {
        focusedWindow.webContents.send('setFormat', 'taskList')
      }
    }),

    new MenuItem({
      label: 'Toggle Checked',
      id: 'format-taskChecked',
      accelerator: 'Cmd+Shift+U',
      click(item, focusedWindow) {
        focusedWindow.webContents.send('setFormat', 'taskChecked')
      }
    }),

    ______________________________,

  ]
})

export function update(applicationMenu) {

  const m = applicationMenu
  const state = global.state()
  const project = state.projects.byId[state.focusedWindowId]
  const panel = project?.panels[project?.focusedPanelIndex]
  const isAPanelFocused = panel && project?.focusedSectionId == 'editor'

  m.getMenuItemById('format-heading').enabled = isAPanelFocused
  m.getMenuItemById('format-strong').enabled = isAPanelFocused
  m.getMenuItemById('format-emphasis').enabled = isAPanelFocused
  m.getMenuItemById('format-code').enabled = isAPanelFocused
  
  m.getMenuItemById('format-link').enabled = isAPanelFocused
  m.getMenuItemById('format-image').enabled = isAPanelFocused
  m.getMenuItemById('format-footnote').enabled = isAPanelFocused
  m.getMenuItemById('format-citation').enabled = isAPanelFocused

  m.getMenuItemById('format-ul').enabled = isAPanelFocused
  m.getMenuItemById('format-ol').enabled = isAPanelFocused

  m.getMenuItemById('format-taskList').enabled = isAPanelFocused
  m.getMenuItemById('format-taskChecked').enabled = isAPanelFocused

}

export function onStateChanged(state, oldState, project, panel, prefsIsFocused, applicationMenu) {
  update(applicationMenu)
}