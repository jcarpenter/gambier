// import { editorState, dispatch } from './state'
import * as actions from './keymapActions'
import { getCharAt, getFromAndTo } from './editor-utils'
import { onBeforeChange } from './onBeforeChange'
import { onChanges } from './onChanges'
import { indentList, unindentList } from './indentList'

export function makeEditor(parentElement) {

  // ------ CREATE ------ //

  const cm = CodeMirror(parentElement, {
    mode: 'gambier',
    lineWrapping: true,
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
    // We add support for `**` and `__` by copying the default config object from closebrackets.js, and adding `**__` to the pairs property.
    autoCloseBrackets: {
      pairs: '__()[]{}\'\'""``',
      closeBefore: ')]}\'":;>',
      triples: '',
      explode: '[]{}',
    },

    // cursorScrollMargin: 20,
    // Turning on `keyMap: 'sublime'` activates -all- sublime keymaps. We instead want to pick and choose, using `extraKeys`
    // keyMap: 'sublime',
    extraKeys: {
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
      '[': () => {
        // When left-bracket key is pressed, set `autocomplete` flag
        const cursor = cm.getCursor()
        const previousChar = getCharAt(cm, cursor.line, cursor.ch - 1)
        if (!previousChar == '^') {
          // cm.dispatch({ type: 'setAutoComplete', value: true })
          // TODO
        }
        return CodeMirror.Pass
      },
      // "'_'": () => wrapTecxt('_')
    },
  })


  // ------ SET PROPERTIES ------ //

  // Set initial editor theme
  cm.setOption('theme', window.state.theme.editorTheme)

  // Add our custom state properties to `cm.state`
  cm.state = { 
    ...cm.state,
    panel: {},
    isMetaKeyDown: false,
    unsavedChanges: false,
    doc: {}, // Only need this for doc.id, and only in one place: saveCursorPosition  
  }

  // Set `dispatch` as method on `cm` object (for convenience)
  // cm.dispatch = dispatch


  // ------ CREATE LISTENERS ------ //

  cm.on('beforeChange', onBeforeChange)
  cm.on('changes', onChanges)
  cm.on('beforeSelectionChange', beforeSelectionChange)

  return cm
}

function beforeSelectionChange(cm, { origin, ranges }) {
  const allMarks = cm.getAllMarks()
  allMarks.forEach((m) => m.component?.onSelectionChange(origin, ranges))
}