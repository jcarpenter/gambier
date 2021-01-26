import { editorState, dispatch } from './state'
import * as actions from './keymapActions'
import { getCharAt } from './editor-utils'
import { onBeforeChange } from './onBeforeChange'
import { onChanges } from './onChanges'
import { onCursorActivity } from './onCursorActivity'

// CodeMirror editor instance
let cm = null


export function makeEditor(parentElement, initialTheme) {

  // ------ CREATE ------ //

  cm = CodeMirror(parentElement, {
    mode: 'gambier',
    lineWrapping: true,
    lineNumbers: false,
    indentWithTabs: false,
    // We use closebracket.js for character-closing behaviour.
    // https://codemirror.net/doc/manual.html#addon_closebrackets
    // We add support for `**` and `__` by copying the default config object from closebrackets.js, and adding `**__` to the pairs property.
    autoCloseBrackets: {
      pairs: '**__()[]{}\'\'""',
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
          // showAutocomplete = true
          // TODO
        }
        return CodeMirror.Pass
      },
      // "'_'": () => wrapTecxt('_')
    },
  })


  // ------ SET PROPERTIES ------ //

  // Set theme
  cm.setOption('theme', 'gambier')

  // Add our custom state properties to `cm.state`
  cm.state = {...cm.state, ...editorState}
  // cm.appState = stateAsObject

  // Set `dispatch` as method on `cm` object (for convenience)
  cm.dispatch = dispatch

  // TODO: Remove this. No longer needede.
  cm.getEditorState = () => { return cm.state }


  // ------ CREATE LISTENERS ------ //

  // cm.on('beforeChange', onBeforeChange)
  cm.on('changes', onChanges)
  cm.on('cursorActivity', onCursorActivity)

  // TODO: 

  // window.api.receive('mainRequestsSaveFile', () => {
  //   saveFile(cm, editorState.doc.path)
  // })

  // // Save open doc when app quits
  // window.api.receive('mainWantsToCloseWindow', async () => {
  //   window.api.send(
  //     'saveFileThenCloseWindow',
  //     editorState.doc.path,
  //     cm.getValue()
  //   )
  // })

  // // Save open doc when app quits
  // window.api.receive('mainWantsToQuitApp', async () => {
  //   window.api.send(
  //     'saveFileThenQuitApp',
  //     editorState.doc.path,
  //     cm.getValue()
  //   )
  // })



  // Load initial doc
  // if (initialDocId) {
  //   cm.dispatch({ type: 'loadDoc', docId: initialDocId })
  // }

  return cm
}