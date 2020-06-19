import TurndownService from '../third-party/turndown/turndown.es.js'

import { hasChanged, isUrl } from "../utils";
import defineGambierMode from './gambierCodeMirrorMode'
import markInlineLinks from './markInlineLinks'
import markCitations from './markCitations'
import markFigures from './markFigures'
import markList from './markList'

import BracketsWidget from '../component/BracketsWidget.svelte'
import { mountReplace } from '../utils'
import { getCharAt } from '../editor/editor-utils'


// -------- SHARED VARIABLES -------- //

let editor
let fileId
let filePath
let bracketsWidget

let lastCursorLine = 0
let locators
let citeproc
let citationItems

const turndownService = new TurndownService()

// -------- SETUP -------- //

/**
 * Load file contents into CodeMirror
 */
function loadFile(file) {
  editor.setValue(file)
  editor.clearHistory()
  // findAndMark()
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
        markFigures(editor, lineHandle, tokens, filePath)
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

// function onInputRead(cm, change) {
//   console.log(change)
// }

// -------- SETUP -------- //

function makeEditor() {

  // Brackets widget
  bracketsWidget = mountReplace(BracketsWidget, {
    target: document.querySelector('#bracketsWidget'),
    // props: {  }
  })

  // Define "gambier" CodeMirror mode
  defineGambierMode()

  // Create CodeMirror instance from `<textarea>` (which is replaced).
  const textarea = document.querySelector('#editor textarea')
  editor = CodeMirror.fromTextArea(textarea, {
    mode: 'gambier',
    lineWrapping: true,
    lineNumbers: false,
    theme: 'gambier',
    indentWithTabs: false,
    autoCloseBrackets: true,
    extraKeys: {
      'Enter': 'newlineAndIndentContinueMarkdownList',
      'Tab': 'autoIndentMarkdownList',
      'Shift-Tab': 'autoUnindentMarkdownList'
    }
  })

  // Setup event listeners
  editor.on("cursorActivity", onCursorActivity)
  editor.on("change", onChange)
  editor.on('beforeChange', onBeforeChange)
  // editor.on("inputRead", onInputRead)
}

async function setup(initialState) {

  // Make editor
  makeEditor()

  // Setup change listeners
  window.api.receive('stateChanged', async (state, oldState) => {

    if (state.changed.includes('selectedFileId')) {
      console.log(state.selectedFileId)
      fileId = state.selectedFileId
      const file = await window.api.invoke('getFileById', fileId, 'utf8')
      loadFile(file)
    }
  })

  // Check if projectPath defined. If no, exit.
  if (
    initialState.projectPath == '' ||
    initialState.selectedFileId == 0
  ) {
    console.log("No project path defined")
    return
  }

  // Get file to load, and load
  fileId = initialState.selectedFileId
  filePath = initialState.contents.find((f) => f.id == fileId).path
  filePath = filePath.substring(0, filePath.lastIndexOf('/'))
  const file = await window.api.invoke('getFileById', fileId, 'utf8')
  loadFile(file)
}

export { setup }