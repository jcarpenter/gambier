import { MenuItem } from "electron";
import { setMenuEnabled } from "./setMenuEnabled.js";
import { ______________________________ } from './Separator.js'

export function create() {

  return new MenuItem({
    label: 'Format',
    id: "format",
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

/**
 * 
 * @param {boolean} enable 
 */
function setEnabledOnAll(appMenu, enable) {
  appMenu.getMenuItemById('format-citation').enabled = enable
  appMenu.getMenuItemById('format-code').enabled = enable
  appMenu.getMenuItemById('format-emphasis').enabled = enable
  appMenu.getMenuItemById('format-footnote').enabled = enable
  appMenu.getMenuItemById('format-heading').enabled = enable
  appMenu.getMenuItemById('format-image').enabled = enable
  appMenu.getMenuItemById('format-link').enabled = enable
  appMenu.getMenuItemById('format-ol').enabled = enable
  appMenu.getMenuItemById('format-plaintext').enabled = enable
  appMenu.getMenuItemById('format-strikethrough').enabled = enable
  appMenu.getMenuItemById('format-strong').enabled = enable
  appMenu.getMenuItemById('format-taskChecked').enabled = enable
  appMenu.getMenuItemById('format-taskList').enabled = enable
  appMenu.getMenuItemById('format-ul').enabled = enable
}



/**
 * Update menu when state changes
 */
export function onStateChanged(state, oldState, project, oldProject, panel, prefsIsFocused, appMenu) {


  /* --------------------------------- Update --------------------------------- */

  const isProjectDirectoryDefined = project?.directory

  // Disable all and return if project directory is not yet defined. 
  if (!isProjectDirectoryDefined) {
    setMenuEnabled("format", false)
    return
  }

  // Else, disable all if 1) editor is not focused, or 2) doc is not markdown.
  const watcher = global.watchers.find((watcher) => watcher.id == state.focusedWindowId);
  const activeDoc = watcher?.files?.byId?.[panel?.docId];

  const isActiveDocMarkdownAndEditorFocused =
    activeDoc?.contentType == 'text/markdown' &&
    project?.focusedSectionId == 'editor'

  // Set enabled on all
  setMenuEnabled("format", isActiveDocMarkdownAndEditorFocused)

  // Strikethrough menu item visibility is driven by a preference.
  appMenu.getMenuItemById('format-strikethrough').visible = state.markdown.strikethrough

}