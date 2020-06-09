import { hasChanged } from "../utils";
import GambierCodeMirrorMode from './gambierCodeMirrorMode'
import markInlineLinks from './markInlineLinks'
import markCitations from './markCitations'
import markFigures from './markFigures'
import markList from './markList'


// -------- SHARED VARIABLES -------- //

let editor
let fileId
let filePath
let lastCursorLine = 0
let locators
let citeproc
let citationItems

// -------- SETUP -------- //

function makeEditor() {

  const textarea = document.querySelector('#editor textarea')

  // Create CodeMirror instance from textarea element. Original is replaced.
  editor = CodeMirror.fromTextArea(textarea, {
    mode: 'gambier',
    lineWrapping: true,
    lineNumbers: false,
    theme: 'gambier',
    // indentUnit: 2,
    indentWithTabs: false,
    extraKeys: {
      'Enter': 'newlineAndIndentContinueMarkdownList',
      'Tab': 'autoIndentMarkdownList',
      'Shift-Tab': 'autoUnindentMarkdownList'
    }
  })

  // Setup event listeners
  editor.on("cursorActivity", onCursorActivity)
}

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


// -------- EVENTS -------- //

/**
 * Every time cursor updates, check last line it was in for citations. We have to do this, because TODO... (along lines of: citations open/close when they're clicked into and out-of)
 */
function onCursorActivity() {
  lastCursorLine = editor.getCursor().line
  findAndMark()
}


// -------- SETUP -------- //

async function setup() {

  const state = await window.api.invoke('getState', 'utf8');
  fileId = state.lastOpenedFileId
  filePath = state.contents.find((f) => f.id == fileId).path
  filePath = filePath.substring(0, filePath.lastIndexOf('/'))
  const file = await window.api.invoke('getFileById', fileId, 'utf8')

  window.api.receive('stateChanged', async (state, oldState) => {
    if (hasChanged("projectDirectory", state, oldState)) {
      filePath = state.projectDirectory
    }
    if (hasChanged("lastOpenedFileId", state, oldState)) {
      fileId = state.lastOpenedFileId
      const file = await window.api.invoke('getFileById', fileId, 'utf8')
      loadFile(file)
    }
  })

  makeEditor()

  loadFile(file)
}

export { setup }