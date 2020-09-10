import TurndownService from '../third-party/turndown/turndown.es.js'

import { hasChanged, isUrl } from "../utils";
import defineGambierMode from './gambierCodeMirrorMode'
import markInlineLinks from './markInlineLinks'
import markCitations from './markCitations'
import markFigures from './markFigures'
import markList from './markList'
import markTaskList from './markTaskList'
// import keyboardCommands from './keyboardCommands'

import BracketsWidget from '../component/BracketsWidget.svelte'
import { mountReplace } from '../utils'
import { getCharAt, getLineStyles, getTextFromRange } from '../editor/editor-utils'


// -------- SHARED VARIABLES -------- //

let state = {}

let editor
let mediaBasePath
let bracketsWidget

let makeMarks = false

let lastCursorLine = 0
let locators
let citeproc
let citationItems

const turndownService = new TurndownService()


// -------- UTILITY -------- //

/**
 * Load file contents into CodeMirror
 * If id param is empty, start new doc. This can happen when opening an empty SideBar item (e.g. Favorites, if there are no files with `favorite` tag.)
 */
async function loadFileByPath(filePath) {
  if (filePath == '') {
    startNewDoc()
  } else {
    // Load file into editor
    const file = await window.api.invoke('getFileByPath', filePath, 'utf8')
    editor.setValue(file)
    editor.clearHistory()
    findAndMark()

    // Update media path
    mediaBasePath = filePath.substring(0, filePath.lastIndexOf('/'))
    // console.log(`mediaBasePath is ${mediaBasePath}`)
  }
}

function startNewDoc() {
  editor.setValue("Empty doc")
  editor.clearHistory()
}

/**
 * Find each citation in the specified line, and collape + replace them.
 */
function findAndMark() {
  // console.log('findAndMark')

  if (!makeMarks) return
  editor.operation(() => {
    editor.eachLine((lineHandle) => {

      // Skip blank lines
      if (!lineHandle.styles || lineHandle.styleClasses == undefined) return

      // For line, create array of classes, with start and stop points
      const tokens = editor.getLineTokens(lineHandle.lineNo())

      console.log(getLineStyles(editor, lineHandle))

      return

      // Array of tokens for the line. 
      // Each is an object, with: `{start: 2, end: 3, string: "[", type: "line-taskOpen"}`
      // const tokens = editor.getLineTokens(lineHandle.lineNo())

      // // String of classes found in the line: `list-1 ul taskClosed
      // const lineStyles = lineHandle.styleClasses.textClass
      // const textStyles = lineHandle.styles

      // // List
      // if (lineStyles.includes('list')) {
      //   // markList(editor, lineHandle, tokens)
      //   if (lineStyles.includes('task')) {
      //     markTaskList(editor, lineHandle, tokens)
      //   }
      // }

      // // Figure
      // if (lineStyles.includes('figure')) {
      //   console.log("Figure")
      // }

      // // Links
      // if (textStyles.some((s) => typeof s === 'string' && s.includes('link'))) { 
      //   markInlineLinks(editor, lineHandle, tokens)
      // }

      // markFigures(editor, lineHandle, tokens, mediaBasePath)
      // markCitations(editor, lineHandle, tokens)

    })
  })
}

/**
 * Set marks, mode and theme according to `sourceMode` state. 
 * E.g. If `sourceMode` is true, we want to strip out the widgets, so we disable `makeMarks`.
 * @param {*} sourceMode 
 */
function toggleSource(sourceMode) {

  // Set mode
  // const mode = sourceMode ? 'markdown' : 'gambier'
  // editor.setOption('mode', mode)

  // Set theme
  // const theme = sourceMode ? 'markdown' : 'gambier'
  // editor.setOption('theme', theme)

  // Enable or disable marks
  if (sourceMode) {
    makeMarks = false
    editor.getAllMarks().forEach((m) => m.clear())
  } else {
    makeMarks = true
    findAndMark()
  }
}


/**
 * Wrap text
 * @param {*} textarea 
 */
function wrapText(character) {
  if (character == '_') {
    const selection = editor.getSelection()
    if (selection) {
      editor.replaceSelection(`_${selection}_`)
    } else {

    }
    console.log('italics')
    console.log(editor.getSelection())
  }
}




// -------- EVENT HANDLERS -------- //

/**
 * "This event is fired before a change is applied, and its handler may choose to modify or cancel the change" — https://codemirror.net/doc/manual.html#event_beforeChange
 * Handle paste operations. If URL, generate link; else, if HTML, convert to markdown.
 */
async function onBeforeChange(cm, change) {
  // console.log('onBeforeChange')

  if (change.origin === 'paste') {
    const selection = editor.getSelection()
    const isURL = isUrl(change.text)

    if (isURL) {
      if (selection) {
        const text = selection
        const url = change.text
        const newText = change.text.map((line) => line = `[${text}](${url})`)
        change.update(null, null, newText)
      }
    } else {
      change.cancel()
      const formats = await window.api.invoke('getFormatOfClipboard')
      if (formats.length === 1 && formats[0] === 'text/plain') {
        cm.replaceSelection(change.text.join('\n'))
      } else if (formats.includes('text/html')) {
        const html = await window.api.invoke('getHTMLFromClipboard')
        const markdown = turndownService.turndown(html)
        cm.replaceSelection(markdown)
      }
    }
  }
}


/**
 * "Fires every time the content of the editor is changed. This event is fired before the end of an operation, before the DOM updates happen." — https://codemirror.net/doc/manual.html#event_change
 */
function onChange(cm, change) {
  // console.log('onChange')
  return

  const text = change.text[0]
  // const from = { line: change.from.line, ch: change.from.ch }
  // const to = { line: change.to.line, ch: change.to.ch }
  // console.log(from.ch, to.ch)

  // const isBracketsCreated = text.charAt(0) == '[' && text.slice(text.length - 1) == ']'
  // if (isBracketsCreated) {
  //   const insideLeftBracket = { line: change.from.line, ch: change.from.ch + 1}
  //   cm.addWidget(insideLeftBracket , bracketsWidget.element)
  //   bracketsWidget.show()
  //   bracketsWidget.from = insideLeftBracket
  // }

  const typedAmpersand = change.text[0] == '@'
  const insideBracket = getCharAt(cm, change.from.line, change.from.ch - 1) == '['
  const startedCitation = typedAmpersand && insideBracket
  if (startedCitation) {
    const currentPos = editor.getCursor()
    cm.addWidget(currentPos, bracketsWidget.element)
    bracketsWidget.from = currentPos
    bracketsWidget.show()
  }

  if (bracketsWidget.visible) {
    let insideRightBracket = { line: change.to.line, ch: 0 }
    insideRightBracket.ch = change.origin == '+delete' ? change.from.ch : change.to.ch + 1
    bracketsWidget.input = editor.getRange(bracketsWidget.from, insideRightBracket)
  }
}

/**
 * "Like the "change" event, but batched per operation, passing an array containing all the changes that happened in the operation. This event is fired after the operation finished, and display changes it makes will trigger a new operation.
" — https://codemirror.net/doc/manual.html#event_changes
 * @param {*} cm 
 * @param {*} changes 
 */
function onChanges(cm, changes) {
  // console.log('onChanges')
  findAndMark()
}

/**
 * Every time cursor updates, check last line it was in for citations. We have to do this, because TODO... (along lines of: citations open/close when they're clicked into and out-of)
 */
function onCursorActivity() {
  // lastCursorLine = editor.getCursor().line
  // editor.addWidget(editor.getCursor(), el)
  // console.log('onCursorActivity')

  // TODO: June 23: Revisit this. Turned off temporarily.
  // findAndMark()
}


// -------- SETUP -------- //

function makeEditor(textarea) {

  // Brackets widget
  // bracketsWidget = mountReplace(BracketsWidget, {
  //   target: document.querySelector('#bracketsWidget'),
  //   // props: {  }
  // })

  // Define "gambier" CodeMirror mode
  defineGambierMode()

  // Create CodeMirror instance from textarea element (which is replaced).
  const editor = CodeMirror.fromTextArea(textarea, {
    mode: 'gambier',
    lineWrapping: true,
    lineNumbers: false,
    indentWithTabs: false,
    // We use closebracket.js for character-closing behaviour. 
    // https://codemirror.net/doc/manual.html#addon_closebrackets
    // We add support for `**` and `__` by copying the default config object from closebrackets.js, and adding `**__` to the pairs property.
    autoCloseBrackets: {
      pairs: "**__()[]{}''\"\"",
      closeBefore: ")]}'\":;>",
      triples: "",
      explode: "[]{}"
    },
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
      'Enter': 'newlineAndIndentContinueMarkdownList',
      'Tab': 'autoIndentMarkdownList',
      'Shift-Tab': 'autoUnindentMarkdownList',
      // "'_'": () => wrapText('_')
    }
  })

  // Setup event listeners
  editor.on('beforeChange', onBeforeChange)
  editor.on("change", onChange)
  editor.on("changes", onChanges)
  editor.on("cursorActivity", onCursorActivity)

  return editor
}


async function setup(textarea, initialState) {

  state = initialState

  // Make editor
  editor = makeEditor(textarea, initialState)
  editor.setOption("theme", initialState.editorTheme)
  toggleSource(initialState.sourceMode)

  // Setup change listeners
  window.api.receive('stateChanged', async (newState, oldState) => {
    state = newState

    if (state.changed.includes('editorTheme')) {
      editor.setOption("theme", newState.editorTheme)
    }

    if (state.changed.includes('openDoc')) {
      if (state.openDoc.path) {
        loadFileByPath(state.openDoc.path)
      }
    }

    if (state.changed.includes('sourceMode')) {
      toggleSource(state.sourceMode)
    }

    if (state.changed.includes('newDoc')) {
      // Place the cursor at the end of the document.
      // We have to wait a moment before calling.
      // Per: https://stackoverflow.com/a/61934020
      setTimeout(() => {
        editor.focus();
        editor.setCursor({
          line: editor.lastLine(),
          ch: editor.getLine(editor.lastLine()).length,
        });
      }, 0)
    }
  })

  window.api.receive('mainRequestsSaveFile', () => {
    window.api.send('dispatch', {
      type: 'SAVE_FILE',
      path: state.openDoc.path,
      data: editor.getValue()
    })
  })

  // "Source mode" toggle reverts displayed text to plain markdown (without widgets, etc) when activated. 
  // window.api.receive('mainRequestsToggleSource', (showSource) => {
  //   const mode = showSource ? 'markdown' : 'gambier'
  //   const theme = showSource ? 'markdown' : 'test'
  //   // editor.setOption('mode', mode)

  //   // Set theme
  //   editor.setOption('theme', theme)

  //   // Enable or disable marks
  //   if (showSource) {
  //     makeMarks = false
  //     editor.getAllMarks().forEach((m) => m.clear())
  //   } else {
  //     makeMarks = true
  //     findAndMark()
  //   }
  // })

  if (state.openDoc.path) {
    loadFileByPath(state.openDoc.path)
  }
}

export { setup }