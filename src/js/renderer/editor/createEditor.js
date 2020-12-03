import defineGambierMode from './gambierCodeMirrorMode'
import * as actions from './keymapActions'
import { getCharAt } from './editor-utils'

export function createEditor (element, theme) {

  // Define "gambier" CodeMirror mode
  defineGambierMode()

  // const cm = CodeMirror.fromTextArea(textarea, {
  const cm = CodeMirror(element, {
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

  cm.setOption("theme", theme)

  return cm
}
