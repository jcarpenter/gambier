import { hasChanged } from "../utils";
import GambierCodeMirrorMode from './gambierCodeMirrorMode'
import markInlineLinks from './markInlineLinks'
import markCitations from './markCitations'


// -------- SHARED VARIABLES -------- //

let editor
let fileId
let lastCursorLine = 0
let locators
let citeproc
let citationItems


// -------- SETUP -------- //

async function makeEditor() {

  const textarea = document.querySelector('#editor textarea')

  // Create CodeMirror instance from textarea element. Original is replaced.
  editor = CodeMirror.fromTextArea(textarea, {
    mode: 'gambier',
    lineWrapping: true,
    lineNumbers: false,
    theme: 'gambier',
  })

  // Setup event listeners
  editor.on("cursorActivity", onCursorActivity)
}

/**
 * Load file contents into CodeMirror
 */
function loadFile(file) {
  editor.setValue(file)
  // findAndMark()
}

/**
 * Find each citation in the specified line, and collape + replace them.
 */
function findAndMark() {
  editor.operation(() => {
    editor.eachLine((lineHandle) => {
      // Mark links
      markInlineLinks(editor, lineHandle)

      // Mark citations
      // markCitations(editor, lineHandle)
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
  const file = await window.api.invoke('getFileById', fileId, 'utf8')

  window.api.receive('stateChanged', async (state, oldState) => {
    if (hasChanged("lastOpenedFileId", state, oldState)) {
      fileId = state.lastOpenedFileId
      const file = await window.api.invoke('getFileById', fileId, 'utf8')
      loadFile(file)
    }
  })

  await makeEditor()

  loadFile(file)
}

export { setup }