import { onPaste } from './onPaste'
import { onCursorActivity } from './onCursorActivity'
import { onChanges } from './onChanges'
import { onDrop } from "./onDrop"

import { altArrow } from './commands/altArrow'
import { asterix } from './commands/asterix'
import { checkIfWeShouldShowAutocomplete } from './autocomplete'
import { backspaceOrDelete } from './commands/backspaceOrDelete'
import { backtick } from './commands/backtick'
import { dash } from './commands/dash'
import { makeElement } from './commands/makeElement'
import { onRenderLine } from './onRenderLine'
import { Pos } from 'codemirror'
import { tab } from './commands/tab'
import { toggleHeader } from './commands/toggleHeader'
import { toggleInlineStyle } from './commands/toggleInlineStyle'
import { toggleList } from './commands/toggleList'
import { toggleTaskChecked } from './commands/toggleTaskChecked'
import { underscore } from './commands/underscore'
import { wasUrlClicked } from './commands/wasUrlClicked'
import { wasUrlEntered } from './commands/wasUrlEntered'
import { wrapText } from './commands/wrapText'
import * as WizardManager from '../WizardManager'
import { tabToNextSpanOrMarker, tabToPrevSpanOrMarker } from './commands/tabTo'
import { checkIfWeShouldCloseHtmlTag } from './editor-utils'
import { duplicateLine } from './commands/duplicateLine'
import { togglePlainText } from './commands/togglePlainText'


export function makeEditor(parentElement, parentPanel) {

  // ------ CREATE ------ //

  const cm = CodeMirror(parentElement, {
    // mode: 'gambier',

    // Activates the `closetag` addon, which closes xml tags (including html) automatically.
    autoCloseTags: {
      dontCloseTags: false,
      indentTags: false
    },

    // "Whether CodeMirror should scroll or wrap for long lines. Defaults to false (scroll)."
    lineWrapping: true,

    // "Whether to show line numbers to the left of the editor."
    lineNumbers: false,

    // "How many spaces a block (whatever that means in the edited 
    // language) should be indented. The default is 2."
    indentUnit: 4,

    // "The width of a tab character. Defaults to 4."
    tabSize: 4,

    // "Whether, when indenting, the first N*tabSize spaces should be 
    // replaced by N tabs. Default is false."
    indentWithTabs: false,

    // "Choos a scrollbar implementation." We use with the Simple Scrollbars addon
    // to enable more control over style. "Overlay" is one of the two addon modes.
    // Docs: https://codemirror.net/doc/manual.html#option_scrollbarStyle
    // Docs: https://codemirror.net/doc/manual.html#addon_simplescrollbars
    scrollbarStyle: "overlay",

    // gutters: [{className: 'toby', style: 'background: red;'}],

    // "If set to true (the default), will keep the cursor height constant for an entire line (or wrapped part of a line). When false, the cursor's height is based on the height of the adjacent reference character."
    singleCursorHeightPerLine: false,

    // "Specifies the amount of lines that are rendered above and below the part of the document that's currently scrolled into view. This affects the amount of updates needed when scrolling, and the amount of work that such an update does. You should usually leave it at its default, 10. Can be set to Infinity to make sure the whole document is always rendered, and thus the browser's text search works on it. This will have bad effects on performance of big documents."
    viewportMargin: Infinity,

    // "How much extra space to always keep above and below the cursor when approaching the top or bottom of the visible view in a scrollable document. Default is 0."
    // cursorScrollMargin: 10,

    // We use `closebracket.js` addon for character-closing behaviour.
    // https://codemirror.net/doc/manual.html#addon_closebrackets
    // https://github.com/codemirror/CodeMirror/blob/master/addon/edit/closebrackets.js
    // We add support for `**` and `__` by copying the default config object from closebrackets.js, and adding `**__` to the pairs property.
    autoCloseBrackets: {
      // pairs: '(){}\'\'""``',
      pairs: '()[]{}\'\'""``',
      closeBefore: ')]}\'":;>',
      triples: '',

      // Explode: "...gives the pairs of characters that, when enter is pressed between them, should have the second character also moved to its own line" (I don't fully understand)
      // explode: '[]{}',
    },

    // cursorScrollMargin: 20,

    // We use a mixture of...
    // 1) Default CodeMirror commmands. E.g. "deleteLine"
    //    See: codemirror.js. Search for `var commands =`
    // 2) Commands defined in the sublime.js add-on. E.g. "selectNextOccurrence"
    //    See: https://codemirror.net/keymap/sublime.js
    // 3) Custom commands

    extraKeys: {
      // 'Alt-T': () => console.log(getElementAt(cm, cm.getCursor().line, cm.getCursor().ch)),
      // 'Alt-T': 'katie',
      'Shift-Cmd-K': 'deleteLine',
      'Cmd-L': 'selectLine',
      'Shift-Alt-Up': () => duplicateLine(cm, 'up'),
      'Shift-Alt-Down': () => duplicateLine(cm, 'down'),
      'Cmd-D': 'selectNextOccurrence',
      'Alt-Up': 'swapLineUp',
      'Alt-Down': 'swapLineDown',
      // '[': 'autocomplete',
      'Shift-Ctrl-Up': 'addCursorToPrevLine',
      'Shift-Ctrl-Down': 'addCursorToNextLine',
      // https://codemirror.net/addon/edit/continuelist.js
      Enter: 'newlineAndIndentContinueMarkdownList',
      'Shift-Cmd-M': (cm, pos) => {
        window.api.send("dispatch", {
          type: "SET_FRONT_MATTER_COLLAPSED",
          value: !window.state.frontMatterCollapsed
        }
        )
      },
      'Cmd-LeftClick': (cm, pos) => wasUrlClicked(cm, pos),
      'Shift-8': () => asterix(cm), // Strong
      'Shift--': () => underscore(cm), // Emphasis
      '`': () => backtick(cm), // Code
      'Cmd-Enter': () => wasUrlEntered(cm),
      'Tab': () => tab(cm, false),
      'Shift-Tab': () => tab(cm, true),
      '-': () => dash(cm),
      'Shift-Alt-Tab': () => tabToPrevSpanOrMarker(cm),
      'Alt-Tab': () => tabToNextSpanOrMarker(cm),
      Backspace: () => backspaceOrDelete(cm, 'backspace'),
      Delete: () => backspaceOrDelete(cm, 'delete'),
      'Alt-Left': () => altArrow(cm, 'left'),
      'Alt-Right': () => altArrow(cm, 'right'),
      'Shift-Cmd-Alt-V': () => {
        cm.state.pasteAsPlainText = true;
        return CodeMirror.Pass
      },
    },
  })

  // ------ SET PROPERTIES ------ //

  // Set initial editor theme
  // NOTE 3/25/2022: I don't think we're using this anymore
  // cm.setOption('theme', window.state.theme.id)

  // Placeholder. Contains copy of associated panel from 
  // `state`. Is updated by `Editor.svelte` whenever that
  // panel changes.
  cm.panel = parentPanel

  // Add our custom state properties to `cm.state`
  cm.state = {
    ...cm.state,
    isMetaKeyDown: false,
    unsavedChanges: false,
  }

  // Set mode
  setMode(cm)



  // ------ CREATE CM and CODEMIRROR LISTENERS ------ //

  /*
  CodeMirror events fire in the following order:
  - beforeChange 
  - beforeSelectionChange
  - paste
  - change
  - cursorActivity
  - changes
  */

  // Check if we should open wizard.
  // Depends on the element hover, and whether it's already open.
  CodeMirror.on(cm.getWrapperElement(), "mouseover", (evt) => {
    WizardManager.onMouseOverCheckIfWeShouldOpenWizard(cm, evt)
  })

  // Check if we should open wizard when user presses meta or alt keys.
  cm.on('keydown', async (cm, evt) => {
    WizardManager.onKeyDownCheckIfWeShouldOpenWizard(cm, evt)
  })

  // Check if we should close wizard.
  // Check if we should show autocomplete.
  cm.on('keyup', (cm, evt) => {

    // Check if we should close wizard
    WizardManager.onKeyUpCheckIfWeShouldCloseWizard(cm, evt)

    // Check if we should show autocomplete:
    checkIfWeShouldShowAutocomplete(cm, evt)

    // Check if we need to manually close an xml tag
    checkIfWeShouldCloseHtmlTag(cm, evt)
  })

  // Send selection updates to marks
  cm.on('beforeSelectionChange', (cm, change) => {
    const { origin, ranges } = change
    const allMarks = cm.getAllMarks()?.filter((m) => m.type !== 'bookmark')
    allMarks.forEach((m) => m.component?.onSelectionChange(origin, ranges))
  })

  cm.on('paste', onPaste)
  cm.on('cursorActivity', onCursorActivity)
  cm.on('changes', onChanges)
  cm.on('drop', onDrop)
  // cm.on('renderLine', onRenderLine)
  // cm.on('update', () => console.log('update'))
  // cm.on('refresh', () => console.log('refresh'))
  // cm.refresh()

  // cm.on('refresh', () => { console.log('Refresh') })


  // ------ CREATE IPC LISTENERS ------ //

  // TODO 4/8: Hate to use deprecated `document.execCommand`, 
  // but I don't know of another way to programmatically trigger
  // paste. 
  window.api.receive('pasteAsPlainText', () => {
    cm.state.pasteAsPlainText = true
    // document.execCommand('paste') 
  })


  // Usually initated by `Edit > Find in Files` menu item.
  // If there is text selected, send it to Search tab query.
  window.api.receive('findInFiles', () => {
    if (cm.somethingSelected()) {
      const selection = cm.getRange(cm.getCursor('from'), cm.getCursor('to'))
      window.api.send('dispatch', {
        type: 'SIDEBAR_SHOW_SEARCH_TAB',
        inputToFocus: 'search',
        queryValue: selection
      })
    }
  })

  window.api.receive('replaceInFiles', () => {
    if (cm.somethingSelected()) {
      const selection = cm.getRange(cm.getCursor('from'), cm.getCursor('to'))
      window.api.send('dispatch', {
        type: 'SIDEBAR_SHOW_SEARCH_TAB',
        inputToFocus: 'replace',
        queryValue: selection
      })
    }
  })

  // Handle commands from `Select` menu
  window.api.receive('editorCommand', (command) => {
    if (!isFocusedPanel(cm)) return
    switch (command) {
      case 'selectLine': cm.execCommand('selectLine'); break
      case 'cutLine': duplicateLine(cm, 'down'); break
      case 'deleteLine': cm.execCommand('deleteLine'); break
      case 'duplicateLine': duplicateLine(cm, 'down'); break
      case 'moveLineUp': cm.execCommand('swapLineUp'); break
      case 'moveLineDown': cm.execCommand('swapLineDown'); break
      case 'selectNextOccurence': cm.execCommand('selectNextOccurrence'); break
      case 'addCursorToPrevLine': cm.execCommand('addCursorToPrevLine'); break
      case 'addCursorToNextLine': cm.execCommand('addCursorToNextLine'); break
      case 'selectNextEntity': tabToNextSpanOrMarker(cm); break
      case 'selectPrevEntity': tabToPrevSpanOrMarker(cm); break
    }
  })

  // Handle commands from `Format` menu
  window.api.receive('setFormat', (cmd) => {
    if (!isFocusedPanel(cm)) return
    switch (cmd) {
      case 'citation': makeElement(cm, 'citation'); break
      case 'code': toggleInlineStyle(cm, 'code', '`'); break
      case 'emphasis': toggleInlineStyle(cm, 'emphasis', window.state.markdown.emphasisChar); break
      case 'footnote': makeElement(cm, 'footnote inline'); break
      case 'heading': toggleHeader(cm); break
      case 'image': makeElement(cm, 'image inline'); break
      case 'link': makeElement(cm, 'link inline'); break
      case 'ol': toggleList(cm, 'ol'); break
      case 'plainText': togglePlainText(cm); break
      case 'strikethrough': toggleInlineStyle(cm, 'strikethrough', '~~'); break
      case 'strong': toggleInlineStyle(cm, 'strong', window.state.markdown.strongChar); break
      case 'ul': toggleList(cm, 'ul'); break
      case 'taskList': toggleList(cm, 'task'); break
      case 'taskChecked': toggleTaskChecked(cm); break
    }
  })

  // ------ RETURN CM INSTANCE ------ //

  return cm
}

/**
 * Utility function. Return true if panel this CM 
 * instance belongs to is focused.
 */
function isFocusedPanel(cm) {
  const project = window.state.projects.byId[window.id]
  const isFocused = cm.panel.index == project.focusedPanelIndex
  return isFocused
}

/**
 * Set `mode` option of the provided CodeMirror instance.
 * We also call this whenever state.markdown options change.
 * Because I don't know how to alter mode options, once set.
 * https://codemirror.net/doc/manual.html#setOption
 */
export function setMode(cm) {

  const doc = window.files.byId[cm.panel?.docId]

  if (!doc) return

  const wrapper = cm.getWrapperElement()

  if (doc.contentType == 'text/markdown') {
    cm.setOption('mode', {
      name: 'gambier',
      markdownOptions: { ...window.state.markdown }
    })
    wrapper.dataset.language = 'markdown'
  } else if (doc.contentType == 'application/json') {
    cm.setOption('mode', { name: 'javascript', json: true })
    wrapper.dataset.language = 'json'
  } else {
    cm.setOption('mode', { name: 'htmlmixed' })
    wrapper.dataset.language = 'htmlmixed'
  }
}
