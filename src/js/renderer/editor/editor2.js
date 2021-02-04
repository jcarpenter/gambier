import { editorState, dispatch } from './state'
import * as actions from './keymapActions'
import { getCharAt } from './editor-utils'
import { onBeforeChange } from './onBeforeChange'
import { onChanges } from './onChanges'
import { onCursorActivity } from './onCursorActivity'

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
    
    // We use `closebracket.js` addon for character-closing behaviour.
    // https://codemirror.net/doc/manual.html#addon_closebrackets
    // We add support for `**` and `__` by copying the default config object from closebrackets.js, and adding `**__` to the pairs property.
    autoCloseBrackets: {
      pairs: '**__()[]{}\'\'""``',
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
      Tab: 'autoIndentMarkdownList',
      'Shift-Tab': 'autoUnindentMarkdownList',
      // 'LeftDoubleClick': doubleClick,
      // 'Cmd-LeftClick': cmdClick,
      Left: () => actions.arrow(cm, 'toLeft'),
      Right: () => actions.arrow(cm, 'toRight'),
      'Alt-Tab': () => actions.tabToNextElement(cm),
      'Shift-Alt-Tab': () => actions.tabToPrevElement(cm),
      Backspace: () => actions.backspaceOrDelete(cm, 'backspace'),
      Delete: () => actions.backspaceOrDelete(cm, 'delete'),
      '[': () => {
        // When left-bracket key is pressed, set `autocomplete` flag
        const cursor = cm.getCursor()
        const previousChar = getCharAt(cm, cursor.line, cursor.ch - 1)
        if (!previousChar == '^') {
          cm.dispatch({ type: 'setAutoComplete', value: true })
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
  cm.state = {...cm.state, ...editorState}

  // Set `dispatch` as method on `cm` object (for convenience)
  cm.dispatch = dispatch


  // ------ CREATE LISTENERS ------ //

  // cm.on('beforeChange', onBeforeChange) // This is commented out of editor2-old...
  cm.on('changes', onChanges)
  cm.on('cursorActivity', onCursorActivity)

  return cm
}