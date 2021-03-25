import * as actions from './keymapActions'
import { onPaste } from './onPaste'
import { onCursorActivity } from './onCursorActivity'
import { onChanges } from './onChanges'
import { onDrop } from "./onDrop"

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
      Enter: 'newlineAndIndentContinueMarkdownList',
      'Cmd-LeftClick': (cm, pos) => actions.wasUrlClicked(cm, pos),
      'Shift-8': () => actions.autoCloseAsterix(cm),
      'Cmd-I': () => actions.wrapText(cm, '_'), // Underscore = Emphasis
      'Shift--': () => actions.wrapText(cm, '_'), // Underscore = Emphasis
      'Shift-Cmd-U': () => actions.toggleTaskChecked(cm),
      'Shift-Cmd-H': () => actions.toggleHeader(cm),
      'Shift-Cmd-L': () => actions.toggleUnorderedList(cm),
      'Cmd-Enter': () => actions.wasUrlEntered(cm),
      'Tab': () => actions.tab(cm, false),
      'Shift-Tab': () => actions.tab(cm, true),
      'Alt-Tab': () => actions.tabToNextElement(cm),
      'Shift-Alt-Tab': () => actions.tabToPrevElement(cm),
      Backspace: () => actions.backspaceOrDelete(cm, 'backspace'),
      Delete: () => actions.backspaceOrDelete(cm, 'delete'),
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

  cm.on('paste', onPaste)
  cm.on('cursorActivity', onCursorActivity)
  cm.on('changes', onChanges) 
  
  cm.on('drop', onDrop)

  // window.api.receive('formatCommand', (cmd) => {
  //   const project = window.state.projects.byId[window.id]
  //   const isFocusedPanel = cm.panel.index == project.focusedPanelIndex
  //   if (isFocusedPanel) actions.wrapText(cm, '_')
  // })

  return cm
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
