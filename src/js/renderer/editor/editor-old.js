import TurndownService from '../third-party/turndown/turndown.es.js'

import markAutocomplete from './markAutocomplete.js'
import markLinks from './markLinks.js'
import markFootnotes from './markFootnotes'
import markImages from './markImages'
import markReferenceFootnote from './markReferenceFootnote'
import markCitations from './markCitations'
import markFigures from './markFigures'
import markList from './markList'
import markTaskList from './markTaskList'

import { getInlineElementsForLine } from "./getInlineElementsForLine";
import { getBlockElements } from "./getBlockElements";
import { hasChanged, isUrl } from "../utils";
import { getCharAt, getTextFromRange } from './editor-utils'
import defineGambierMode from './gambierCodeMirrorMode'

import Wizard from '../component/wizard/Wizard.svelte'
import AutocompleteMenu from '../component/AutocompleteMenu.svelte'
// import { contextBridge } from 'electron'

// import keyboardCommands from './keyboardCommands'
// import BracketsWidget from '../component/BracketsWidget.svelte'


// -------- SHARED VARIABLES -------- //

// State
let state = {}
let sourceMode
let showAutocomplete = false
// let isChangesPending = false
// let isMouseButtonDown = false

// ^ We use `isChangesPending` inside `cursorActivity` event handler, for certain actions. `cursorActivity` fires every time a change is made, because changes tend to move the cursor (e.g. typing a new character). But `cursorActivity` fires before changes are written to the DOM. For code that relies on tbe new DOM (like marking text), this is problematic, and we need to instead wait for `changes` event, which fires "...after the operation finished" (per docs: https://codemirror.net/doc/manual.html#events). So every time we make a change, we set `isChangesPending` true in `change` handler (which fires first), then check it in `cursorActivity` handler (as needed), then reset it false at the end the `changes` handler (which is called last). Confusing! But works.

// CodeMirror
let cm
let doc

// Paths
let mediaBasePath

// Entities & References
let inlineElements = []
let blockElements = []

// GUI
let bracketsWidget
let wizard

// TODO
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
// async function loadFileByPath(filePath) {
//   if (filePath == '') {
//     clearEditorContentsAndHistory()
//   } else {
//     // Load file into editor
//     const file = await window.api.invoke('getFileByPath', filePath, 'utf8')
//     cm.setValue(file)
//     cm.clearHistory()
//     // mapDocEntities()

//     // Update media path
//     mediaBasePath = filePath.substring(0, filePath.lastIndexOf('/'))
//     // console.log(`mediaBasePath is ${mediaBasePath}`)
//   }
// }

// function clearEditorContentsAndHistory() {
//   cm.setValue('')
//   cm.clearHistory()
// }

/**
 * Place the cursor at the end of the document. NOTE: We have to wait a moment before calling, per: https://stackoverflow.com/a/61934020
 * TODO: Remember and restore the last cursor position.
 */
// function focusEditor() {
//   setTimeout(() => {
//     cm.focus();
//     cm.setCursor({
//       line: cm.lastLine(),
//       ch: cm.getLine(cm.lastLine()).length,
//     });
//   }, 0)
// }

/**
 * Called when `sourceMode` state changes. Re-runs the doc marking logic.
 * If `sourceMode` is true, we render plain markup, without widgets.
 * @param {*} sourceMode 
 */
// function toggleSource() {
//   console.log('toggleSource')


//   // Maintain cursor position after toggle, if a widget is focused and we're changing to `sourceMode`. Work out the position to set to after the change, and the set it at the end of this function.
//   let setCursorPosAfterMarksCleared = undefined
//   if (sourceMode && !cm.hasFocus()) {
//     const editableWidget = inlineElements.find((e) => e.widget && e.widget.editable && e.widget.focused)
//     const widgetIsFocused = editableWidget !== undefined

//     if (widgetIsFocused) {
//       setCursorPosAfterMarksCleared = {
//         line: editableWidget.line,
//         ch: editableWidget.start + window.getSelection().getRangeAt(0).endOffset + 1
//       }
//     }
//   }

//   // Focus the editor first. If we don't do this, and the cursor is inside an editable widget when the toggle is flipped, we get an error.
//   cm.focus()
//   clearDocMarks()
//   markDoc()

//   // Set cursor position
//   if (setCursorPosAfterMarksCleared !== undefined) {
//     doc.setCursor(setCursorPosAfterMarksCleared)
//   }
// }


/**
 * Wrap text
 * @param {*} textarea 
 */
// function wrapText(character) {
//   if (character == '_') {
//     const selection = cm.getSelection()
//     if (selection) {
//       cm.replaceSelection(`_${selection}_`)
//     } else {

//     }
//     console.log('italics')
//     console.log(cm.getSelection())
//   }
// }



// -------- MAP ELEMENTS & REFERENCES -------- //

// function mapBlockElements() {

//   // Reset
//   blockElements = []

//   blockElements = getBlockElements(cm)
// }

// /**
//  * Get entities for each line as an array, with `getInlineElementsForLine`
//  * Push the array into `docEntities`. Index is line number.
//  */
// function mapInlineElements() {

//   // Reset
//   inlineElements = []

//   // Map
//   cm.operation(() => {
//     cm.eachLine((lineHandle) => {
//       const lineEntities = getInlineElementsForLine(cm, lineHandle, blockElements)
//       if (lineEntities.length) {
//         inlineElements = inlineElements.concat(lineEntities)
//       }
//     })
//   })
// }

// /**
//  * Remap inline elements for a single line.
//  */
// function remapInlineElementsForLine(lineNo, lineHandle) {

//   let fromIndex = null
//   let toIndex = null
//   inlineElements.forEach((il, index) => {
//     if (il.line == lineNo) {
//       if (fromIndex == null) {
//         fromIndex = index
//       } else {
//         toIndex = index
//       }
//     }
//   })
//   if (toIndex == null) toIndex = fromIndex

//   // Get new line elements
//   const lineElements = getInlineElementsForLine(cm, lineHandle, blockElements)

//   // Update inlineElements array by 1) deleting elements on the same line, (fromIndex to toIndex), and 2) inserting new line elements
//   inlineElements.splice(fromIndex, toIndex - fromIndex + 1, ...lineElements)
// }


// -------- MARK -------- //

/**
 * Mark all lines in the document
 */
// function markDoc() {
//   doc.getAllMarks().forEach((m) => m.clear())
//   cm.operation(() => {
//     cm.eachLine((lineHandle) => markLine(lineHandle))
//   })
// }

// /**
//  * Mark selected lin
//  * @param {*} lineHandle 
//  */
// function markLine(lineHandle) {

//   const cursor = doc.getCursor()


//   const elements = inlineElements.filter((e) => e.line == lineHandle.lineNo())

//   const links = elements.filter((e) => e.type.includes('link') && !e.type.includes('image'))
//   if (links.length) markLinks(cm, lineHandle, links, sourceMode, cursor)

//   const images = elements.filter((e) => e.type.includes('image'))
//   if (images.length) markImages(cm, lineHandle, images, sourceMode)

//   const footnotes = elements.filter((e) => e.type.includes('footnote'))
//   if (footnotes.length) markFootnotes(cm, lineHandle, footnotes, sourceMode, cursor)

// }


// /**
//  * Clear marks from a line
//  */
// function clearLineMarks(lineHandle) {
//   const lineNo = lineHandle.lineNo()
//   const lineLength = lineHandle.text.length
//   const lineMarks = doc.findMarks({ line: lineNo, ch: 0 }, { line: lineNo, ch: lineLength })
//   lineMarks.forEach((m) => m.clear())
// }




// -------- EVENT HANDLERS -------- //

/**
 * "This event is fired before a change is applied, and its handler may choose to modify or cancel the change" — https://codemirror.net/doc/manual.html#event_beforeChange
 * Handle paste operations. If URL, generate link; else, if HTML, convert to markdown.
 */
// async function onBeforeChange(cm, change) {

//   // console.log('onBeforeChange')
//   // console.log(change)

//   // If a new doc was loaded, and we don't want to run these operations.
//   if (change.origin === 'setValue') {
//     return
//   }

//   // Handle paste operations
//   if (change.origin === 'paste') {
//     const selection = cm.getSelection()
//     const isURL = isUrl(change.text)

//     if (isURL) {
//       if (selection) {
//         const text = selection
//         const url = change.text
//         const newText = change.text.map((line) => line = `[${text}](${url})`)
//         change.update(null, null, newText)
//       }
//     } else {
//       change.cancel()
//       const formats = await window.api.invoke('getFormatOfClipboard')
//       if (formats.length === 1 && formats[0] === 'text/plain') {
//         cm.replaceSelection(change.text.join('\n'))
//       } else if (formats.includes('text/html')) {
//         const html = await window.api.invoke('getHTMLFromClipboard')
//         const markdown = turndownService.turndown(html)
//         cm.replaceSelection(markdown)
//       }
//     }
//   }
// }


/**
 * "Fires every time the content of the editor is changed. This event is fired before the end of an operation, before the DOM updates happen." — https://codemirror.net/doc/manual.html#event_change
 */
// function onChange(cm, change) {
//   // console.log('onChange')
//   // console.log(change)

//   isChangesPending = true

// }

/**
 * "Will be fired when the cursor or selection moves, or any change is made to the editor content." - https://codemirror.net/doc/manual.html#event_cursorActivity
 */
// function onCursorActivity(e) {

//   // console.log('onCursorActivity')

//   const cursor = doc.getCursor()
//   const selection = { string: cm.getSelection() }

//   if (!sourceMode) {

//     // Highlight (or de-highlight) widgets...
//     // TODO: Make this work across lines. Get line -and- cursor from doc.getCursor().

//     if (selection.string !== '') {

//       // CodeMirror `getCursor`: https://codemirror.net/doc/manual.html#getCursor
//       // "Retrieve one end of the primary selection. start is an optional string indicating which end of the selection to return. It may be 'from', 'to', 'head' (the side of the selection that moves when you press shift+arrow), or 'anchor' (the fixed side of the selection). Omitting the argument is the same as passing 'head'. A {line, ch} object will be returned."
//       selection.from = doc.getCursor("from").ch
//       selection.to = doc.getCursor("to").ch
//       selection.anchor = doc.getCursor("anchor").ch
//       selection.head = doc.getCursor("head").ch

//       const effectedWidgetElements = inlineElements.filter((e) => e.line == cursor.line && e.widget && e.start >= selection.from && e.end <= selection.to)

//       // Highlight (but do not select) widgets inside the selection
//       effectedWidgetElements.forEach((e) => e.widget.selectInsideLargerSelection())

//     } else if (cm.hasFocus()) {

//       // Dehighlight widget elements:
//       // CursorActivity fires any time we set cursor position in `cm`.
//       // If widgets are highlighted, this is when we de-highlight them.
//       // But we want them to remain highlighted if wizard is open.

//       // Clear widget highlights: When we `click` or `arrow` without making a selection, we want to de-highlight any highlighted widgets. Note that we check first is CodeMirror has focus. This prevents the following code from running while a widget is focused, which avoids conflicts with Option-Tabbing through widgets (that operation also triggers `cursorActivity`).
//       const highlightedWidgets = inlineElements.filter((e) => e.widget && e.widget.highlighted)
//       highlightedWidgets.forEach((e) => e.widget.deHighlight())
//     }
//   }

//   // Update wizard
//   // if (!isChangesPending) updateWizard()
// }


/**
 * "Like the 'change' event, but batched per operation, passing an array containing all the changes that happened in the operation. This event is fired after the operation finished, and display changes it makes will trigger a new operation." — https://codemirror.net/doc/manual.html#event_changes
 * @param {*} cm 
 * @param {*} changes 
 */
// function onChanges(cm, changes) {

//   // console.log('editor: onChanges()')

//   // Checks

//   const hasNewDocLoaded = changes[0].origin === 'setValue'
//   const hasMultipleLinesChanged = changes.some((change) => {
//     return change.from.line !== change.to.line || change.origin === '+swapLine'
//   })
//   const isSingleEdit = changes.length == 1
//   const isUndo = changes.some((change) => change.origin == 'undo')

//   // Set cursor, if `cm.setCursorAfterChanges` !== null. We use this when want to place the cursor at a specific position _after_ we've changed the text.

//   if (cm.setCursorAfterChanges !== null) {
//     doc.setCursor(cm.setCursorAfterChanges)
//     // Reset
//     cm.setCursorAfterChanges = null
//   }

//   // Remap elements and re-mark: 
//   // * Everything, if new doc has loaded, or multiple lines have changed.
//   // * Else, one line only

//   if (hasNewDocLoaded || hasMultipleLinesChanged) {

//     mapBlockElements()
//     mapInlineElements()
//     markDoc()

//   } else {

//     // If above are not true, we assume only one line has changed.

//     const lineNo = changes[0].from.line
//     const lineHandle = doc.getLineHandle(lineNo)

//     // Autocomplete: Determine if we need to open it or not
//     if (showAutocomplete && isSingleEdit && !isUndo) {

//       // If preceding character was `^`, user is trying to create an inline footnote, so we don't open the autocomplete UI. We just make sure the wizard opens after the widget is created.

//       const changeText = changes[0].text[0]
//       const emptyBrackets = changeText == '[]'
//       const bracketsAroundSingleSelection = !emptyBrackets && changeText.charAt(0) == '[' && changeText.charAt(changeText.length - 1) == ']'

//       if (emptyBrackets || bracketsAroundSingleSelection) {
//         markAutocomplete(cm, changeText)
//         showAutocomplete = false
//       }
//     } else {

//       // Remap everything if line changed had block styles. We do this because blockElements can contain reference definitions. And if reference definitions change, lineElements also need to be remapped (because they incorporate data from reference definitions).
//       const hasBlockElementChanged = lineHandle.styleClasses !== undefined
//       if (hasBlockElementChanged) {
//         mapBlockElements()
//         mapInlineElements()
//         markDoc()
//       } else {

//         // Remap lineElements, redo line marks, and finish
//         remapInlineElementsForLine(lineNo, lineHandle)
//         clearLineMarks(lineHandle)
//         markLine(lineHandle)
//       }
//     }
//   }

//   // TODO: Would be nice to have wizard automatically detect changes to inlineElements. But that would require inlineElements being an object (it's currently an array), etc.
//   wizard.onChanges(inlineElements)

//   // Focus widget, if `cm.focusWidgetAfterChanges` !== null. We use this when we want to focus a widget after making changes (e.g. creating it in Autocomplete).

//   if (cm.focusWidgetAfterChanges !== null) {
//     const from = cm.focusWidgetAfterChanges.from
//     const to = cm.focusWidgetAfterChanges.to
//     const element = inlineElements.find((e) => from.line == e.line && from.ch <= e.start && to.ch >= e.end && e.widget && e.widget.editable)
//     if (element) element.widget.tabInto()

//     // Reset
//     cm.focusWidgetAfterChanges = null
//   }

//   isChangesPending = false

// }

/**
 * TODO
 */
// function onFocus() {
//   // console.log('onFocus')
//   if (cm.setCursorAfterChanges !== null) {
//     doc.setCursor(cm.setCursorAfterChanges)
//     cm.setCursorAfterChanges = null
//   }
// }



// -------- WIDGET INTERACTIONS -------- //

// /**
//  * Ensure we can arrow the cursor smoothly from editor text into editable widget. This is called by keymap for arrow key presses. Depending on `direction`, checks if next character is the `start` or `end` of an editable widget, and if yes, positions cursor inside that widget.
//  * @param {} direction 
//  */
// function arrow(direction) {

//   if (sourceMode) return CodeMirror.Pass

//   const cursor = doc.getCursor()

//   let adjacentInlineEl = null

//   if (direction == 'toLeft') {
//     adjacentInlineEl = inlineElements.find((e) => e.line == cursor.line && e.end == cursor.ch)
//   } else if (direction == 'toRight') {
//     adjacentInlineEl = inlineElements.find((e) => e.line == cursor.line && e.start == cursor.ch)
//   }

//   if (adjacentInlineEl && adjacentInlineEl.widget && adjacentInlineEl.widget.editable) {

//     const sideWeEnterFrom = direction == 'toLeft' ? 'right' : 'left'
//     adjacentInlineEl.widget.arrowInto(sideWeEnterFrom)

//   } else {
//     return CodeMirror.Pass
//   }
// }


// /**
//  * Tab to the previous element in the document
//  */
// function tabToPrevElement() {

//   const { line: cursorLine, ch: cursorCh } = doc.getCursor()

//   // Create array of "tabbable" elements. These are widgets, unless we're in sourceMode, in which case they're element children (e.g. text, url, title).
//   let tabbableElements = []
//   if (!sourceMode) {
//     tabbableElements = inlineElements.filter((e) => e.widget)
//   } else {
//     inlineElements.forEach((e) => {
//       e.children.forEach((c) => {
//         if (!c.collapsed && !c.classes.includes('md')) tabbableElements.push(c)
//       })
//     })
//   }

//   const element = tabbableElements.slice().reverse().find((e) =>
//     e.line <= cursorLine &&
//     // If entity is on same line as cursor, look backwards from current cursor ch.
//     // Else, look backwards from end of line.
//     e.end < (e.line == cursorLine ? cursorCh : cm.getLineHandle(e.line).text.length)
//   )

//   // Find the closest tabbable element before the cursor.
//   if (element) {
//     if (sourceMode) {
//       doc.setSelection({ line: element.line, ch: element.start }, { line: element.line, ch: element.end }, { scroll: true })
//     } else {
//       element.widget.tabInto()
//     }
//   }
// }

// /**
//  * Tab to the next element in the document.
//  */
// function tabToNextElement() {

//   const { line: cursorLine, ch: cursorCh } = doc.getCursor()

//   // Create array of "tabbable" elements. These are widgets, unless we're in sourceMode, in which case they're element children (e.g. text, url, title).
//   let tabbableElements = []
//   if (!sourceMode) {
//     tabbableElements = inlineElements.filter((e) => e.widget)
//   } else {
//     inlineElements.forEach((e) => {
//       e.children.forEach((c) => {
//         if (!c.collapsed && !c.classes.includes('md')) tabbableElements.push(c)
//       })
//     })
//   }

//   // Find the next tabbable element
//   const element = tabbableElements.find((e) =>
//     e.line >= cursorLine &&
//     // If entity is on same line as cursor, look forward from current cursor ch.
//     // Else, look forward from start of line (zero).
//     e.start >= (e.line == cursorLine ? cursorCh : 0)
//   )

//   // Select and focus the element
//   if (element) {
//     if (sourceMode) {
//       doc.setSelection({ line: element.line, ch: element.start }, { line: element.line, ch: element.end }, { scroll: true })
//     } else {
//       element.widget.tabInto()
//     }
//   }
// }

// /**
//  * Make it hard to accidentally delete widgets by selecting them first. User must press again to then actually delete the item. This second press is handled by the widget. This logic just checks whether the cursor...
//  * @param {*} keyPressed 
//  */
// function backspaceOrDelete() {

//   const cursor = doc.getCursor()
//   const selection = { string: cm.getSelection() }

//   if (selection.string == '') {

//     const adjacentWidgetEl = inlineElements.find((e) => e.line == cursor.line && e.widget && cursor.ch >= e.start && cursor.ch <= e.end)

//     if (adjacentWidgetEl) {
//       adjacentWidgetEl.widget.selectIndividually()
//     } else {
//       return CodeMirror.Pass
//     }
//   } else {
//     return CodeMirror.Pass
//   }
// }


// -------- SETUP -------- //

// function makeEditor(textarea) {

//   // Define "gambier" CodeMirror mode
//   defineGambierMode()

//   // Create CodeMirror instance from textarea element (which is replaced).
//   const cm = CodeMirror.fromTextArea(textarea, {
//     mode: 'gambier',
//     lineWrapping: true,
//     lineNumbers: false,
//     indentWithTabs: false,
//     // We use closebracket.js for character-closing behaviour. 
//     // https://codemirror.net/doc/manual.html#addon_closebrackets
//     // We add support for `**` and `__` by copying the default config object from closebrackets.js, and adding `**__` to the pairs property.
//     autoCloseBrackets: {
//       pairs: "**__()[]{}''\"\"",
//       closeBefore: ")]}'\":;>",
//       triples: "",
//       explode: "[]{}"
//     },
//     // Turning on `keyMap: 'sublime'` activates -all- sublime keymaps. We instead want to pick and choose, using `extraKeys`
//     // keyMap: 'sublime',
//     extraKeys: {
//       'Shift-Cmd-K': 'deleteLine',
//       'Cmd-L': 'selectLine',
//       'Shift-Alt-Down': 'duplicateLine',
//       'Cmd-D': 'selectNextOccurrence',
//       'Alt-Up': 'swapLineUp',
//       'Alt-Down': 'swapLineDown',
//       'Shift-Ctrl-Up': 'addCursorToPrevLine',
//       'Shift-Ctrl-Down': 'addCursorToNextLine',
//       'Enter': 'newlineAndIndentContinueMarkdownList',
//       'Tab': 'autoIndentMarkdownList',
//       'Shift-Tab': 'autoUnindentMarkdownList',
//       // 'LeftDoubleClick': doubleClick,
//       // 'Cmd-LeftClick': cmdClick,
//       'Left': () => arrow('toLeft'),
//       'Right': () => arrow('toRight'),
//       'Alt-Tab': tabToNextElement,
//       'Shift-Alt-Tab': tabToPrevElement,
//       'Backspace': () => backspaceOrDelete(),
//       'Delete': () => backspaceOrDelete(),
//       '[': () => {
//         // When left-bracket key is pressed, set `autocomplete` flag
//         const cursor = doc.getCursor()
//         const previousChar = getCharAt(cm, cursor.line, cursor.ch - 1)
//         if (!previousChar == '^') {
//           showAutocomplete = true
//         }
//         return CodeMirror.Pass
//       },
//       // "'_'": () => wrapTecxt('_')
//     }
//   })

//   // Get doc
//   doc = cm.getDoc()

//   // Setup event listeners
//   cm.on('beforeChange', onBeforeChange)
//   cm.on("change", onChange)
//   cm.on("changes", onChanges)
//   cm.on("cursorActivity", onCursorActivity)
//   cm.on("focus", onFocus)
//   // cm.on("blur", () => console.log("Blur"))

//   return cm
// }


async function setup(textarea, initialState) {

  // state = initialState

  // // Make editor
  // cm = makeEditor(textarea, initialState)
  // cm.setOption("theme", initialState.theme)

  // // Source mode
  // sourceMode = initialState.sourceMode

  // Make autocomplete menu
  // const frag1 = document.createDocumentFragment();
  // const autocompleteMenu = new AutocompleteMenu({
  //   target: frag1,
  //   props: {
  //   }
  // })
  cm.display.sizer.appendChild(frag1)
  cm.autocomplete = {}
  cm.autocomplete.menu = autocompleteMenu

  // Make wizard, and append to `sizer` element. This is the same element that CodeMirror `addWidget` function adds widget elements to. Add wizard object to `cm` so we can access it easily.
  // const frag = document.createDocumentFragment();
  // wizard = new Wizard({
  //   target: frag,
  //   props: {
  //     cm: cm,
  //   }
  // })
  cm.display.sizer.appendChild(frag)
  cm.wizard = wizard

  // Add `cursorPosAfterChangesApplied` property to `cm`. We use this in modules such as Autocomplete to set the cursor inside a changed block of text. Normally the cursor will be set to the outside of the changed block (e.g. when you paste a sentance into a document). Which is good, normally, but sometimes we want to put the cursor inside the new text. As in the case of the Autocomplete widget, when the user presses escape, the widget disappears, we write the new text to the doc, and we want to make it look like the cursor is in the same position afterwards.
  cm.setCursorAfterChanges = null

  // Add `focusWidgetAfterChanges` property to `cm`. We use this in modules such as Autocomplete to target an editable widget -after- changes have been written. In the case of Autocomplete, because we're creating the widget, but it won't exist until `onChanges` calls mark function(s). 
  // Format: `{ from: { line: 0, ch: 22 }, to: { line: 0, ch: 36 } }`
  cm.focusWidgetAfterChanges = null

  // Add `data-metakeydown` attribute to `sizer` element while meta key is pressed. We use this in various CSS :hover styles to cue to user that clicking will trigger a different action (e.g. jump to reference definition) than normal clicking.

  // window.addEventListener('keydown', (evt) => {
  //   if (evt.metaKey) {
  //     cm.display.scroller.setAttribute('data-metakeydown', true)
  //   }
  // })

  // window.addEventListener('keyup', (evt) => {
  //   if (!evt.metaKey) {
  //     cm.display.scroller.setAttribute('data-metakeydown', false)
  //   }
  // })

  // Setup event listener for mouse button pressed. We use `isMouseButtonDown` inside `onCursorActivity`, to enable/disable some selection interactions. We add listener to the `scroller` object, which is the size of the editor window.
  // cm.display.scroller.addEventListener('mousedown', (e) => {
  //   isMouseButtonDown = true
  //   cm.display.scroller.addEventListener('mouseup', (e) => {
  //     isMouseButtonDown = false
  //   })
  // })

  // // Setup change listeners
  // window.api.receive('stateChanged', async (newState, oldState) => {
  //   state = newState

  //   if (state.changed.includes('theme')) {
  //     cm.setOption("theme", newState.theme)
  //   }

  //   if (state.changed.includes('openDoc')) {
  //     if (state.openDoc.path) {
  //       loadFileByPath(state.openDoc.path)
  //     }
  //   }

  //   if (state.changed.includes('sourceMode')) {
  //     sourceMode = state.sourceMode
  //     toggleSource()
  //   }

  //   if (state.changed.includes('focusedLayoutSection')) {
  //     if (state.focusedLayoutSection == 'editor') {
  //       focusEditor()
  //     }
  //   }
  // })

  // window.api.receive('mainRequestsSaveFile', () => {
  //   window.api.send('dispatch', {
  //     type: 'SAVE_FILE',
  //     path: state.openDoc.path,
  //     data: cm.getValue()
  //   })
  // })

  // // Load the openDoc
  // if (state.openDoc.path) {
  //   loadFileByPath(state.openDoc.path)
  //   focusEditor()
  // }
}

export { setup }