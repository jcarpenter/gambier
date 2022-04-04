import { MenuItem } from "electron";
import { ______________________________ } from './Separator.js'

export function create() {

  return new MenuItem({
    label: 'Format',
    submenu: [

      new MenuItem({
        label: 'Plain Text',
        id: 'format-plaintext',
        accelerator: 'Cmd+Shift+P',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'plainText')
        }
      }),
  
      ______________________________,

      new MenuItem({
        label: 'Heading',
        id: 'format-heading',
        accelerator: 'Cmd+Shift+H',
        // registerAccelerator: false,
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'heading')
        }
      }),
  
      ______________________________,
  
      new MenuItem({
        label: 'Strong',
        id: 'format-strong',
        accelerator: 'Cmd+B',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'strong')
        }
      }),
  
      new MenuItem({
        label: 'Emphasis',
        id: 'format-emphasis',
        accelerator: 'Cmd+I',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'emphasis')
        }
      }),
  
      new MenuItem({
        label: 'Code',
        id: 'format-code',
        accelerator: 'Cmd+Shift+D',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'code')
        }
      }),
  
      new MenuItem({
        label: 'Strikethrough',
        id: 'format-strikethrough',
        accelerator: 'Cmd+Shift+X',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'strikethrough')
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
        label: 'Ordered List',
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
        accelerator: 'Alt+Enter',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'taskChecked')
        }
      }),
  
      ______________________________,
  
    ]
  })
}


export function update(appMenu) {

  const m = appMenu
  const state = global.state()
  const project = state.projects.byId[state.focusedWindowId];
  const panel = project?.panels[project?.focusedPanelIndex];
  const watcher = global.watchers.find((watcher) => watcher.id == state.focusedWindowId);
  const activeDoc = watcher?.files?.byId[panel?.docId];
  
  const isActiveDocMarkdownAndEditorFocused = 
    activeDoc?.contentType == 'text/markdown' &&
    project?.focusedSectionId == 'editor'

  // Disable when editor is not focused,
  // or if editor document is not markdown

  m.getMenuItemById('format-citation').enabled = isActiveDocMarkdownAndEditorFocused
  m.getMenuItemById('format-code').enabled = isActiveDocMarkdownAndEditorFocused
  m.getMenuItemById('format-emphasis').enabled = isActiveDocMarkdownAndEditorFocused
  m.getMenuItemById('format-footnote').enabled = isActiveDocMarkdownAndEditorFocused
  m.getMenuItemById('format-heading').enabled = isActiveDocMarkdownAndEditorFocused
  m.getMenuItemById('format-image').enabled = isActiveDocMarkdownAndEditorFocused
  m.getMenuItemById('format-link').enabled = isActiveDocMarkdownAndEditorFocused
  m.getMenuItemById('format-ol').enabled = isActiveDocMarkdownAndEditorFocused
  m.getMenuItemById('format-plaintext').enabled = isActiveDocMarkdownAndEditorFocused
  m.getMenuItemById('format-strikethrough').enabled = isActiveDocMarkdownAndEditorFocused
  m.getMenuItemById('format-strikethrough').visible = state.markdown.strikethrough
  m.getMenuItemById('format-strong').enabled = isActiveDocMarkdownAndEditorFocused
  m.getMenuItemById('format-taskChecked').enabled = isActiveDocMarkdownAndEditorFocused
  m.getMenuItemById('format-taskList').enabled = isActiveDocMarkdownAndEditorFocused
  m.getMenuItemById('format-ul').enabled = isActiveDocMarkdownAndEditorFocused

}

export function onStateChanged(state, oldState, project, panel, prefsIsFocused, appMenu) {
  update(appMenu)
}