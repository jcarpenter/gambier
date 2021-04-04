import { onPaste } from './onPaste'
import { onCursorActivity } from './onCursorActivity'
import { onChanges } from './onChanges'
import { onDrop } from "./onDrop"

import { altArrow } from './commands/altArrow'
import { asterix } from './commands/asterix'
import { backspaceOrDelete } from './commands/backspaceOrDelete'
import { makeElement } from './commands/makeElement'
import { tab } from './commands/tab'
import { tabToNextElement } from './commands/tabToNextElement'
import { tabToPrevElement } from './commands/tabToPrevElement'
import { toggleHeader } from './commands/toggleHeader'
import { toggleList } from './commands/toggleList'
import { toggleTaskChecked } from './commands/toggleTaskChecked'
import { wasUrlClicked } from './commands/wasUrlClicked'
import { wasUrlEntered } from './commands/wasUrlEntered'
import { wrapText } from './commands/wrapText'


export function makeEditor(parentElement) {

  // ------ CREATE ------ //

  const cm = CodeMirror(parentElement, {
    // mode: 'gambier',

    // "Whether CodeMirror should scroll or wrap for long lines. Defaults to false (scroll)."
    lineWrapping: true,
    
    // "Whether to show line numbers to the left of the editor."
    lineNumbers: false,

    // "How many spaces a block (whatever that means in the edited 
    // language) should be indented. The default is 2."
    indentUnit: 4,

    // "The width of a tab character. Defaults to 4."
    tabSize: 4,

    // "Whether, when indenting, the first N*tabSize spaces should be 
    // replaced by N tabs. Default is false."
    indentWithTabs: false,

    // "Whether CodeMirror should scroll or wrap for long lines. Defaults to false (scroll)."
    lineWrapping: true,

    // gutters: [{className: 'toby', style: 'background: red;'}],

    // We use `closebracket.js` addon for character-closing behaviour.
    // https://codemirror.net/doc/manual.html#addon_closebrackets
    // https://github.com/codemirror/CodeMirror/blob/master/addon/edit/closebrackets.js
    // We add support for `**` and `__` by copying the default config object from closebrackets.js, and adding `**__` to the pairs property.
    autoCloseBrackets: {
      pairs: '()[]{}\'\'""``',
      closeBefore: ')]}\'":;>',
      triples: '',
      
      // Explode: "...gives the pairs of characters that, when enter is pressed between them, should have the second character also moved to its own line" (I don't fully understand)
      // explode: '[]{}',
    },

    // cursorScrollMargin: 20,
    // Turning on `keyMap: 'sublime'` activates -all- sublime keymaps. We instead want to pick and choose, using `extraKeys`
    // keyMap: 'sublime',
    // https://codemirror.net/keymap/sublime.js
    extraKeys: {
      // 'Alt-T': () => console.log(getElementAt(cm, cm.getCursor().line, cm.getCursor().ch)),
      'Shift-Cmd-K': 'deleteLine',
      'Cmd-L': 'selectLine',
      'Shift-Alt-Down': 'duplicateLine',
      'Cmd-D': 'selectNextOccurrence',
      'Alt-Up': 'swapLineUp',
      'Alt-Down': 'swapLineDown',
      'Shift-Ctrl-Up': 'addCursorToPrevLine',
      'Shift-Ctrl-Down': 'addCursorToNextLine',
      // https://codemirror.net/addon/edit/continuelist.js
      Enter: 'newlineAndIndentContinueMarkdownList',
      'Cmd-LeftClick': (cm, pos) => wasUrlClicked(cm, pos),
      'Shift-8': () => asterix(cm),
      'Shift--': () => wrapText(cm, '_'), // Underscore = Emphasis
      'Cmd-Enter': () => wasUrlEntered(cm),
      'Tab': () => tab(cm, false),
      'Shift-Tab': () => tab(cm, true),
      'Alt-Tab': () => tabToNextElement(cm),
      'Shift-Alt-Tab': () => tabToPrevElement(cm),
      Backspace: () => backspaceOrDelete(cm, 'backspace'),
      Delete: () => backspaceOrDelete(cm, 'delete'),
      'Alt-Left': () => altArrow(cm, 'left'),
      'Alt-Right': () => altArrow(cm, 'right'),
    },
  })

  // ------ SET PROPERTIES ------ //

  // Set mode
  setMode(cm)

  // Set initial editor theme
  cm.setOption('theme', window.state.theme.editorTheme)

  // 
  cm.panel = {}

  // Add our custom state properties to `cm.state`
  cm.state = { 
    ...cm.state,
    isMetaKeyDown: false,
    unsavedChanges: false,
  }
  

  // ------ CREATE LISTENERS ------ //

  /*
  CodeMirror events fire in the following order:
  - beforeChange 
  - beforeSelectionChange
  - paste
  - change
  - cursorActivity
  - changes
  */

  // On `beforeChange`, send selection updates to marks
  cm.on('beforeSelectionChange', (cm, change) => {
    const { origin, ranges } = change
    const allMarks = cm.getAllMarks()?.filter((m) => m.type !== 'bookmark')
    allMarks.forEach((m) => m.component?.onSelectionChange(origin, ranges))
  })

  cm.on('paste', onPaste)
  cm.on('cursorActivity', onCursorActivity)
  cm.on('changes', onChanges) 
  cm.on('drop', onDrop)


  // window.api.receive('editor-command', (command) => {
  //   switch (command) {
  //     case 'cut': 
  //       cm.triggerOnKeyDown({
  //         type: 'keydown',
  //         keyCode: 88,
  //         altKey: false,
  //         shiftKey: false,
  //         metaKey: true,
  //       })
  //       break
  //   }
  // })

  // TODO 4/1: Re-implement this 
  // Need to set `cm.state.pasteAsPlainText` true, and then initiate the paste. I think.
  // window.api.receive('pasteAsPlainText', () => actions.pasteAsPlainText(cm))


  // Usually initated by `Edit > Find in Files` menu item.
  // If there is text selected, send it to Search tab query.
  window.api.receive('findInFiles', () => {
    if (cm.somethingSelected()) {
      const selection = cm.getRange(cm.getCursor('from'), cm.getCursor('to'))
      window.api.send('dispatch', {
        type: 'SET_SEARCH_QUERY',
        query: selection
      })
    }
  })

  window.api.receive('replaceInFiles', () => {
    if (cm.somethingSelected()) {
      const selection = cm.getRange(cm.getCursor('from'), cm.getCursor('to'))
      window.api.send('dispatch', {
        type: 'SET_SEARCH_QUERY',
        query: selection
      })
    }
  })

  window.api.receive('setFormat', (cmd) => {
    if (isFocusedPanel(cm)) {
      switch (cmd) {
        case 'citation': makeElement(cm, 'citation'); break
        case 'code': wrapText(cm, '`'); break
        case 'emphasis': wrapText(cm, '_'); break
        case 'footnote': makeElement(cm, 'footnote inline'); break
        case 'heading': toggleHeader(cm); break
        case 'image': makeElement(cm, 'image inline'); break
        case 'link': makeElement(cm, 'link inline'); break
        case 'strong': wrapText(cm, '*'); break
        case 'ul': toggleList(cm, 'ul'); break
        case 'ol': toggleList(cm, 'ol'); break
        // case 'taskList': TODO; break
        // case 'taskChecked': toggleTaskChecked(cm); break
      }
    }
  })

  return cm
}

/**
 * Utility function. Return true if panel this CM 
 * instance belongs to is focused.
 */
function isFocusedPanel(cm) {
  const project = window.state.projects.byId[window.id]
  const isFocused = cm.panel.index == project.focusedPanelIndex
  return isFocused
}

/**
 * Set `mode` option of the provided CodeMirror instance.
 * We also call this whenever state.markdown options change.
 * Because I don't know how to alter mode options, once set.
 * https://codemirror.net/doc/manual.html#setOption
 */
export function setMode(cm) {
  cm.setOption('mode', {
    name: 'gambier',
    markdownOptions: {...window.state.markdown}
  })
}
