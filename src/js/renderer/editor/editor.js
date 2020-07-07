import TurndownService from '../third-party/turndown/turndown.es.js'

import { hasChanged, isUrl } from "../utils";
import defineGambierMode from './gambierCodeMirrorMode'
import markInlineLinks from './markInlineLinks'
import markCitations from './markCitations'
import markFigures from './markFigures'
import markList from './markList'
import keyboardCommands from './keyboardCommands'

import BracketsWidget from '../component/BracketsWidget.svelte'
import { mountReplace } from '../utils'
import { getCharAt } from '../editor/editor-utils'


// -------- SHARED VARIABLES -------- //

let state = {}

let editor
let mediaBasePath
let bracketsWidget

let lastCursorLine = 0
let locators
let citeproc
let citationItems

const turndownService = new TurndownService()


// -------- SETUP -------- //

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
    console.log(`mediaBasePath is ${mediaBasePath}`)
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
  editor.operation(() => {
    editor.eachLine((lineHandle) => {
      const tokens = editor.getLineTokens(lineHandle.lineNo())
      const isFigure = tokens.some((t) => t.type !== null && t.type.includes('figure'))
      // const isFigure = tokens[0] !== undefined && tokens[0].type.includes('figure')
      const isList = tokens[0] !== undefined && tokens[0].type !== null && tokens[0].type.includes('list')

      if (isFigure) {
        // markFigures(editor, lineHandle, tokens, mediaBasePath)
      } else {
        if (isList) {
          markList(editor, lineHandle, tokens)
        }
        markInlineLinks(editor, lineHandle, tokens)
        // markCitations(editor, lineHandle, tokens)
      }
    })
  })
}


// -------- EVENT HANDLERS -------- //

/**
 * Every time cursor updates, check last line it was in for citations. We have to do this, because TODO... (along lines of: citations open/close when they're clicked into and out-of)
 */
function onCursorActivity() {
  lastCursorLine = editor.getCursor().line
  // editor.addWidget(editor.getCursor(), el)

  // TODO: June 23: Revisit this. Turned off temporarily.
  findAndMark()
}

function onChange(cm, change) {
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
 * Handle paste operations
 * If URL, generate link.
 * Else, if HTML, convert to markdown} cm 
 */
async function onBeforeChange(cm, change) {

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
    theme: 'gambier',
    indentWithTabs: false,
    autoCloseBrackets: true,
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
      'Shift-Tab': 'autoUnindentMarkdownList'
    }
  })

  // Setup event listeners
  editor.on("cursorActivity", onCursorActivity)
  // editor.on("change", onChange)

  /**
   * "This event is fired before a change is applied, and its handler may choose to modify or cancel the change"
   * See: https://codemirror.net/doc/manual.html#event_beforeChange
   */
  editor.on('beforeChange', onBeforeChange)

  return editor
}

async function setup(textarea, initialState) {

  state = initialState

  // Make editor
  editor = makeEditor(textarea)

  // Setup change listeners
  window.api.receive('stateChanged', async (newState, oldState) => {
    state = newState
    if (state.changed.includes('openDoc')) {
      if (state.openDoc.path) {
        loadFileByPath(state.openDoc.path)
      }
    }
  })

  window.api.receive('mainRequestsSaveFile', () => {
    window.api.send('dispatch', {
      type: 'SAVE_FILE',
      path: state.openDoc.path,
      data: editor.getValue()
    })
  })

  window.api.receive('mainRequestsToggleSource', (showSource) => {
    const mode = showSource ? 'markdown' : 'gambier'
    const theme = showSource ? 'markdown' : 'gambier'
    editor.setOption('mode', mode)
    editor.setOption('theme', theme)
    if (showSource) {
      editor.getAllMarks().forEach((m) => m.clear())
    } else {
      findAndMark()
    }
  })

  if (state.openDoc.path) {
    loadFileByPath(state.openDoc.path)
  }
}

export { setup }