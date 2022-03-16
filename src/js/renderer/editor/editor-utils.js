import { setMode } from "./editor"
import { markDoc } from "./mark"
import * as map from './map'
import { blankLineRE, listStartRE, headerStartRE, blockQuoteStartRE } from "./regexp"
import { Pos } from "codemirror"



// -------- GET DOCUMENT DETAILS -------- //

/**
 * For the htmlBlock located at line, find the last line.
 * @param {*} line 
 */
export function getLastLineOfHtmlBlock(cm, line) {
 
  // Confirm `line` is an htmlBlock. If not, return.
  const lineHandle = cm.getLineHandle(line)
  const lineClasses = map.getLineClasses(lineHandle)
  const lineIsHtmlBlock = lineClasses?.includes('htmlBlock')
  if (!lineIsHtmlBlock) return undefined

  // Walk subequent lines in doc until we find the
  // next one with a token of type `htmlBlock-lastLine`.  
  let lastLine = undefined
  for (var i = line; i < cm.lineCount(); i++) {
    const tokens = cm.getLineTokens(i)
    const isLastLine = tokens.some(({type}) => type?.includes('htmlBlock-lastLine'))
    if (isLastLine) {
      lastLine = i
      break
    }
  }

  return lastLine
}

/**
 * Check if we should auto-close an open html tag.
 * We need to do this manually for the first, opening tag.
 * The `closetag` addon usually does this for us.
 * But it doesn't work for that first, opening tag.
 * Called by `keyup` listener when evt.key == '>'
 */
export function checkIfWeShouldCloseHtmlTag(cm, evt) {

  // The `closetag` addon and `autoCloseTags: true` option handle this
  // inside html blocks. But for inline html (e.g. adding a <b> tag
  // inside a line of markdown), we need to handle it manually. 
  if (evt.key == '>') {
    const ranges = cm.listSelections()
    ranges.forEach((r) => {

      const mode = cm.getModeAt(r.head)
      if (mode.name == 'xml') {

        // If this `>` closes a tag,
        // and the matching closing tag is missing,
        // create that closing tag. 
        // By calling the "closeTag" commmand.

        const token = cm.getTokenAt(r.head)
        const inner = CodeMirror.innerMode(cm.getMode(), token.state)

        // "<span>Here's a clip <video src='trailer.mp4'>|</video> from the trailer</span>"
        const line = cm.getLine(r.head.line)

        // "<span>Here's a clip <video src='trailer.mp4'>"
        const lineBeforeCursor = line.slice(0, r.head.ch)

        // "</video> from the trailer</span>"
        const lineAfterCursor = line.slice(r.head.ch)

        // ["span", "video"]
        const parentTags = Object.values(inner.mode.xmlCurrentContext(inner.state))

        // "video"
        const parentTag = parentTags[parentTags.length - 1]

        // True or False
        // Checks if "video src="trailer.mp4>" starts with "video"
        const parentTagImmediatelyPrecedes = lineBeforeCursor.slice(lineBeforeCursor.lastIndexOf('<') + 1).startsWith(parentTag)

        // If typed `>` character does not close the parent tag, return.
        // It means the user is typing a ">" as normal text.
        if (!parentTagImmediatelyPrecedes) return

        // If closing tag does not immediately follow the typed ">",
        // close it.
        const closingTagImmediatelyFollows = lineAfterCursor.startsWith(`</${parentTag}>`)
        if (!closingTagImmediatelyFollows) {
          cm.execCommand('closeTag')
        }

        // Old way:
        // We only manually close xml tag in very specific case:
        // The user has just typed the closing `>` of an opening
        // tag, in an inline stretch of html (not a block). 
        // E.g. `Some markdown text <b>|`
        // const isHtmlBlock = cm.getTokenAt(r.head).type.includes('htmlBlock')
        // const eolModeIsXml = cm.getModeAt(Pos(r.head.line, cm.getLine(r.head.line).length)).name == 'xml'
        // const isOpenInlineHtmlTag = !isHtmlBlock && eolModeIsXml
        // if (isOpenInlineHtmlTag) {
        //   cm.execCommand('closeTag')
        // }
      }
    })

    // Restore selections. Otherwise when closeTag command fires,
    // it places cursor on far right side of the closed tag.
    // 1.) <b> - Before `closeTag`
    // 2.) <b></b>| - After `closeTag`
    // 3.) <b>|</b> - After we restore selections
    cm.setSelections(ranges)
  }
}

/**
 * Return a {state, mode} object with the inner mode and its 
 * state for the given line number.
 * @param {*} line - Integer. Line number. 
 */
export function getModeAndState(cm, line) {
  const eolState = cm.getStateAfter(line)
  return CodeMirror.innerMode(cm.getMode(), eolState)
}

/**
 * Sometimes we need to access CodeMirror instances from outside their parent Editor components. This is a convenience function for finding the CM instance from `windows.cmInstances` by the ID of it's associated panel, and getting it's ddata.
 * @param {*} panelId 
 */
export function getCmDataByPanelId(panelId) {
  const cmInstance = window.cmInstances.find((c) => c.panel.id == panelId)
  const data = cmInstance.getValue()
  return data
}

/**
 * For the given reference label, find the definition.
 * Returns object
 * @param {*} cm 
 * @param {*} label 
 * @param {*} type - 'link' or 'footnote' 
 */
export function getReferenceDefinitions(cm, label, type = 'link') {

  let definitionsMatchingLabel = []

  for (var i = 0; i < cm.lineCount(); i++) {
    const firstTokenType = cm.getTokenTypeAt({ line: i, ch: 0 })
    if (!firstTokenType) continue
    if (!firstTokenType.includes(`${type}-reference-definition-start`)) continue
    const element = map.getElementAt(cm, i, 1)
    const elementLabel = element.spans.find((s) => s.type.includes('label'))?.string
    if (elementLabel == label) {
      definitionsMatchingLabel.push(element)
    }
  }

  return definitionsMatchingLabel
}


/**
 * Is specified line a list?
 */
export function isList(cm, line) {
  const lineHandle = cm.getLineHandle(line)
  const lineIsList = map.getLineClasses(lineHandle).includes('list')
  return lineIsList
}


/**
 * For a given range, if there are multiple lines selected,
 * return true if the lines contain a heterogeneous mix of
 * line styles (e.g. header and ul).
 */
export function isLineClassesHeterogeneous(cm, range) {

  const { topLine, bottomLine } = getTopAndBottomLines(range)

  // If this is a single line selection, it cannot contain
  // multiple line styles, so we return false.
  if (topLine == bottomLine) return false

  const lineClassesInsideRange = []
  for (var i = topLine; i <= bottomLine; i++) {
    const lineHandle = cm.getLineHandle(i)
    const lineClasses = map.getLineClasses(lineHandle)
    if (lineClasses) {
      // lineClasses are formatted like `header h1` and `ol list-1`
      // The "main" style is always the first word.
      // That's the one we want.
      const mainLineClass = lineClasses.split(' ')[0]
      lineClassesInsideRange.push(mainLineClass)
    }
  }

  // We know line styles are heterogeneous if they don't all
  // match the first one.
  const areHeterogeneous =
    lineClassesInsideRange.length > 1 &&
    !lineClassesInsideRange.every((ls) => {
      return ls == lineClassesInsideRange[0]
    })

  return areHeterogeneous

}


/**
 * For the given range (containing `anchor` and `pos`) objects,
 * determine which comes first in the document, and return as 
 * `from` and `to` objects.
 */
export function getFromAndTo(range, trimEmptyToLine = false) {

  const objA = range.anchor
  const objB = range.head
  const { anchor, head } = range
  const sameLine = anchor.line == head.line

  if (sameLine) {
    // Selection is inside same line:
    // Compare the characters

    const test = CodeMirror.cmpPos(range.anchor, range.head)
    if (test <= 0) {
      var from = anchor
      var to = head
    } else {
      var from = head
      var to = anchor
    }

    // const earlierCh = Math.min(objA.ch, objB.ch)
    // const laterCh = Math.max(objA.ch, objB.ch)
    // var from = [objA, objB].find((o) => o.ch == earlierCh)
    // var to = [objA, objB].find((o) => o.ch == laterCh)
  } else {
    // Selection is across multiple lines:
    // Compare the lines
    const earlierLine = Math.min(objA.line, objB.line)
    const laterLine = Math.max(objA.line, objB.line)
    var from = [objA, objB].find((o) => o.line == earlierLine)
    var to = [objA, objB].find((o) => o.line == laterLine)
  }

  if (from.line !== to.line && to.ch == 0 && trimEmptyToLine) {
    to.line--
  }

  const isMultiLine = from.line !== to.line
  const isSingleCursor = !isMultiLine && from.ch == to.ch

  return { from, to, isMultiLine, isSingleCursor }
}



// -------- READ/WRITE STRINGS FROM DOC -------- //


/**
 * Return a single character at the specified position
 */
export function getCharAt(cm, line, ch = 0) {
  return cm.getRange(
    { line: line, ch: ch }, // from
    { line: line, ch: ch + 1 } // to
  )
}


/**
 * A _slighty_ more compact snippet for getting text from a range.
 */
export function getTextFromRange(cm, line, start, end) {
  return cm.getRange({ line: line, ch: start }, { line: line, ch: end })
}


/**
 * Return N characters immediately preceding the `fromPos` value.
 * @param {*} cm 
 * @param {*} numOfCharacters - How many characters before fromPos.ch to get
 * @param {*} fromPos - Pos (object with line and ch) to look before.
 */
export function getPrevChars(cm, numSkipBehind, numToGet, fromPos,) {
  const { line, ch } = fromPos
  return cm.getRange(
    { line, ch: ch - numSkipBehind - numToGet },
    { line, ch: ch - numSkipBehind }
  )
}


/**
 * Return N characters immediately following the `fromPos` value.
 * @param {*} cm 
 * @param {*} numToGet - How many characters after fromPos.ch to get
 * @param {*} fromPos - Pos (object with line and ch) to look before.
 */
export function getNextChars(cm, numSkipAhead, numToGet, fromPos) {
  const { line, ch } = fromPos
  return cm.getRange(
    { line, ch: ch + numSkipAhead },
    { line, ch: ch + numSkipAhead + numToGet }
  )
}


// -------- WRITE -------- //

/**
 * Write input value to cm.
 */
export function writeToDoc(cm, value, line, start, end) {
  cm.replaceRange(
    value,
    { line, ch: start },
    { line, ch: end },
    '+input'
  )
}


/**
 * Write multiple edits to doc then set selections.
 * Ensures changes apply to correct characters when making
 * by applying changes bottom to top, right to left. Otherwise,
 * earlier edits would change the doc "out from underneath"
 * later edits, which would then be appled to the wrong chars.
 * `cm.replaceSelections` does this also, but doesn't give us
 * fine grained control over 1) what is replaced (e.g. when what
 * is selected and what we want to replace don't match 1:1), 
 * and 2) what is selected after the changes are made.
 * The `select.type` option of edits supports the following:
 * - 'around': Select the new text, minus (optional) insets.
 * - 'start': Place cursor at start of change
 * - 'end': Place cursor at end of change
 * @param {array} edits - Array of { text, from, to, select } edits.
 * @param {string} origin - Defaults to '+input'
 */
export function writeMultipleEdits(cm, edits, origin = '+input') {

  let selections = []

  cm.operation(() => {

    // Apply edits from right-to-left, bottom-to-top of doc.
    // This way we don't need to update the position of
    // the changes as we go.
    edits.sort((a, b) => {
      return CodeMirror.cmpPos(b.from, a.from);
    })

    edits.forEach((edit) => {

      const { text, from, to, select } = edit

      // Apply the changes
      cm.replaceRange(text, from, to, origin)

      // Create a change object to use with `CodeMirror.changeEnd`
      // It needs a `text` object where `text` is split into an 
      // array of line.
      const editorChange = { text: text.split('\n'), from, to }

      // Adjust other selections, based on change made
      // If they're before the change, they won't be effected.
      selections.forEach((s) => {
        s.anchor = adjustPosForChange(s.anchor, editorChange)
        s.head = adjustPosForChange(s.head, editorChange)
      })

      // Push the selection for this change, per the `select` 
      // option of the edit. 

      const toPosAfterChange = CodeMirror.changeEnd(editorChange)

      switch (select.type) {
        case 'cursor': {
          selections.push({
            anchor: Pos(from.line, from.ch + select.ch),
            head: Pos(from.line, from.ch + select.ch)
          })
          break
        }
        case 'range': {
          selections.push({
            anchor: select.from,
            head: select.to
          })
          break
        }
        case 'start': {
          selections.push({
            anchor: from,
            head: from
          })
          break
        }
        case 'end': {
          const end = CodeMirror.changeEnd(editorChange)
          selections.push({ anchor: toPosAfterChange, head: toPosAfterChange })
          break
        }
        case 'around':
        default: {
          const insetLeft = select.inset ? select.inset[0] : 0
          const insetRight = select.inset ? select.inset[1] : 0
          selections.push({
            anchor: Pos(from.line, from.ch + insetLeft),
            head: Pos(toPosAfterChange.line, toPosAfterChange.ch - insetRight)
          })
          break
        }
      }

    })

    // Apply the updated selections
    cm.setSelections(selections)

  })
}






// -------- SAVE, OPEN, CLOSE -------- //

/**
 * On change, update `unsavedChanges` value on the parent panel.
 * Avoid spamming by first checking if there's a mismatch
 * between current state value and `cm.doc.isClean()`.
 */
export function setUnsavedChanges(cm) {
  const docIsNowClean = cm.doc.isClean()
  const prevStateHadUnsavedChanges = cm.panel.unsavedChanges

  if (docIsNowClean && prevStateHadUnsavedChanges) {
    // Need to update panel state: The doc is now clean.
    window.api.send('dispatch', {
      type: 'SET_UNSAVED_CHANGES',
      panelIndex: cm.panel.index,
      value: false
    })
  } else if (!prevStateHadUnsavedChanges) {
    // Need to update panel state: The doc now has unsaved changes.
    window.api.send('dispatch', {
      type: 'SET_UNSAVED_CHANGES',
      panelIndex: cm.panel.index,
      value: true
    })
  }
}

/**
 * Load empty doc into editor, and clear history
 * @param {*} cm 
 */
export function loadEmptyDoc(cm) {
  if (!cm) return

  cm.swapDoc(CodeMirror.Doc('', 'gambier'))
  cm.focus()
}

/**
 * Load doc into the editor, and clear history
 * @param {*} doc - Instance of an object from `files.byId`
 */
export async function loadDoc(cm, doc) {

  if (!cm || !doc) return

  // Get the doc text
  const text = doc.path ?
    await window.api.invoke('getFileByPath', doc.path, 'utf8') : ''

  // Load the doc text into the editor, and clear history.
  // "Each editor is associated with an instance of CodeMirror.Doc, its document. A document represents the editor content, plus a selection, an undo history, and a mode. A document can only be associated with a single editor at a time. You can create new documents by calling the CodeMirror.Doc(text: string, mode: Object, firstLineNumber: ?number, lineSeparator: ?string) constructor" — https://codemirror.net/doc/manual.html#Doc
  cm.swapDoc(CodeMirror.Doc(text))
  setMode(cm)

  // Restore cursor position, if possible
  const cursorHistory = window.state.cursorPositionHistory[doc.id]
  if (cursorHistory) {
    cm.setCursor(cursorHistory)

    // Vertically center cursor inside scrollable area
    const heightOfEditor = cm.getScrollInfo().clientHeight
    cm.scrollIntoView(null, heightOfEditor / 2)
  }

  // Map, mark and focus the editor
  markDoc(cm)

  cm.refresh()

  // setCursor(cm)
}

/**
 * Focus the editor. We wrap in a setTimeout or it doesn't work.
 * @param {*} cm 
 */
export function focusEditor(cm) {
  setTimeout(() => {
    cm.focus()
  }, 0)
}

/** 
 * Save cursor position, so we can restore it if the doc is-reopened during the same app session (cursor position histories are erased at the start of each new app session).
 */
export function saveCursorPosition(cm) {

  const docId = cm.panel.docId
  const cursorPos = cm.doc.getCursor()

  // Only save if the doc is not empty, 
  // and the cursor is not on the first line.
  const shouldSaveCursorPos = docId && cursorPos.line !== 0

  if (shouldSaveCursorPos) {
    window.api.send('dispatch', {
      type: 'SAVE_CURSOR_POSITION',
      docId,
      line: cursorPos.line,
      ch: cursorPos.ch
    })
  }
}




// -------- WIZARD -------- //

export function switchInlineReferenceType(cm, newType) {
  // Strings depend on whether we're dealing with link, image or footnote

  if (newType == 'reference') {
    cm.replaceRange(
      `[${target.text.string}][]`,
      { line: target.line, ch: target.start },
      { line: target.line, ch: target.end }
    )
  } else if (newType == 'inline') {
    const text =
      target.type == 'link-reference-full'
        ? target.text.string
        : target.label.string
    const url = target.definition.url.string
    const title = target.definition.title.string
    cm.replaceRange(
      `[${text}](${url}${title})`,
      { line: target.line, ch: target.start },
      { line: target.line, ch: target.end }
    )
  }
}

export function switchReferenceStyles(cm, value, start, end) {
  console.log(value)
}

export function jumpToLine(cm, line, ch = 0) {
  cm.setCursor(line, ch)
  cm.focus()
}



// -------- MISC -------- //

/**
 * Adjusts a given position taking a given replaceRange-type edit into account. If the position is within the original edit range (start and end inclusive), it gets pushed to the end of the content that replaced the range. Otherwise, if it's after the edit, it gets adjusted so it refers to the same character it did before the edit.
 * Same as CodeMirror.adjustForChange(), but that's a private function that Marijn dos not want to expose publicly.
 * @param {object} pos - { line: 12, ch: 5 }
 * @param {object} change - { text: ['Hello', 'World'], from, to }
 */
export function adjustPosForChange(pos, change) {

  // If pos is before start of change, return pos unchanged.
  // Hello dinos        ch = 2
  //   ^   |   |
  // Hello mammalia     ch = 2
  //   ^   |      | 
  if (CodeMirror.cmpPos(pos, change.from) < 0) {
    return pos
  }

  // Else, if pos is inside the change from/to, return the end 
  // of the change range, after the change is applied.
  // Hello dinos        ch = 8
  //       | ^ |
  // Hello mammalia     ch = 14
  //       |      |^ 
  // if (CodeMirror.cmpPos(pos, change.to) <= 0) {
  //     return CodeMirror.changeEnd(change)
  // }

  // Else, if pos is inside the change from/to, 
  // do nothing (return pos unchanged)
  if (CodeMirror.cmpPos(pos, change.to) <= 0) {
    return pos
  }

  // Else, if pos is after the change, return the position after
  // the change is applied.
  // Hello dinos        ch = 11
  //       |   |^
  // Hello mammalia     ch = 14
  //       |      |^ 
  let line = pos.line + change.text.length - (change.to.line - change.from.line) - 1
  let ch = pos.ch
  if (pos.line === change.to.line) {
    // If pos is on same line as `to`, update the ch value.
    ch += CodeMirror.changeEnd(change).ch - change.to.ch
  }
  return { line, ch }
}

/**
 * If line has any block formatting (e.g. header, list)
 * return line text, minus the block formatting. Useful when
 * we're converting between different block types.
 * @param {*} cm 
 * @param {integer} line - Line number
 */
export function getLineTextWithoutBlockFormatting(cm, line, state = undefined) {
  let text = cm.getLine(line)
  if (!state) state = getModeAndState(cm, line).state
  if (state.header) {
    return text.replace(headerStartRE, '')
  } else if (state.list) {
    return text.replace(listStartRE, '')
  } else if (state.quote) {
    return text.replace(blockQuoteStartRE, '')
  } else {
    return text // unchanged
  }
}

export function lineIsPlainText(cm, line) {
  const lineClasses = map.getLineClasses(cm.getLineHandle(line))
  return lineClasses == ''
}

/**
 * Return `from` and `to` positions of the primary selection.
 * If `trim...` params are `true`, we exclude from and/or to
 * lines if their `ch` starts at the end or start of the line, 
 * respectively. This catches an annoying edge case, where the
 * user selects lines by dragging from the lines above or below.
 * In CodeMirror it doesn't look like the initiating lines are
 * part of the selection, but they are, which can cause 
 * unexpected results. Trimming them solves the confusion.
 * @param {boolean} trimEmptyFromLine
 * @param {boolean} trimEmptyToLine
 */
export function getPrimarySelection(cm, trimEmptyFromLine = false, trimEmptyToLine = true) {

  const from = cm.getCursor('from')
  const to = cm.getCursor('to')
  let isMultiLine = from.line !== to.line

  if (isMultiLine && trimEmptyFromLine) {
    if (from.ch == cm.getLine(from.line).length) {
      from.line++
    }
  }

  if (isMultiLine && trimEmptyToLine) {
    if (to.ch == 0) {
      to.line--
    }
  }

  // Update multiline, in case we trimmed lines
  isMultiLine = from.line !== to.line

  return { from, to, isMultiLine }
}

/**
 * Return the `start` and `end` line numbers of the list
 * of the specified type, at the specified line (if one exists).
 * @param {*} line - Integer. Look up and down from this line.
 * @param {*} type - `ul` or `ol`
 */
export function getStartAndEndOfList(cm, line, type, stopAtBlankLines = true) {

  // Find start
  let start = undefined
  for (var i = line; i >= 0; i--) {
    const lineIsListOfSelectedType = getModeAndState(cm, i).state.list == type
    const breakForBlank = stopAtBlankLines && blankLineRE.test(cm.getLine(i))
    if (lineIsListOfSelectedType && !breakForBlank) {
      start = i
    } else {
      break
    }
  }

  // Find end
  let end = undefined
  for (var i = line; i <= cm.lastLine(); i++) {
    const lineIsListOfSelectedType = getModeAndState(cm, i).state.list == type
    const breakForBlank = stopAtBlankLines && blankLineRE.test(cm.getLine(i))
    if (lineIsListOfSelectedType && !breakForBlank) {
      end = i
    } else {
      break
    }
  }

  return { start, end }

}

/**
 * Traverse an ordered list and set the counter on each row.
 * @param {} line - First line in the list.
 */
export function orderOrderedList(cm, line, origin = '+input', indent = 1, startAtFirstLineOfParentList = false) {
  let stillInsideTree = true
  let counter = 1

  // If true, find and set `line` to start of overall list.
  // This ensures the entire list will be ordered
  // (not just a child branch)
  if (startAtFirstLineOfParentList) {
    const { start, end } = getStartAndEndOfList(cm, line, 'ol')
    line = start
  }

  // While we're still inside this tree, do the following...
  while (stillInsideTree) {

    const { state, mode } = getModeAndState(cm, line)
    const lineIsOl = state.list == 'ol'
    const lineIndent = state.listStack.length
    let lineText = cm.getLine(line)

    if (!lineIsOl || !lineText || lineIndent < indent) {

      // Exit once we're no longer inside the tree
      stillInsideTree = false

    } else if (lineIndent > indent) {

      // Child branch found. Order it, then skip the
      // lines that it processed.
      line = orderOrderedList(cm, line, origin, lineIndent)
      continue

    } else {

      // Increment the list item
      // Then update the `line` and `counter` variables
      const newLineText = lineText.replace(/(\s*?)(\d)(\.|\))(\s*)/, (match, p1, p2, p3, p4) => {
        return `${p1}${counter}${p3}${p4}`
      })
      if (newLineText !== lineText) {
        cm.replaceRange(newLineText, { line: line, ch: 0 }, { line: line, ch: lineText.length }, origin)
      }
      line++
      counter++

    }
  }

  return line
}


export async function getClipboardContents() {
  try {
    const text = await navigator.clipboard.readText()
    return text
  } catch (err) {
    console.error('Failed to read clipboard contents: ', err)
  }
}


/**
 * Return local system file path with `file:///` scheme.
 * Used primarily for loading project assets like images.
 * Handles input paths that 1) are relative to parent doc,
 * 2) are relative to project directory, or 3) that include 
 * project directory.
 * - Local and relative to parent doc:  `../Images/graph.png`
 * - Local and relative to project: 		`/Images/graph.png`
 * - Include project directory:         `Users/josh/Desktop/Notes/Images/graph.png`
 * - Returns: `file:///Users/josh/Desktop/Notes/Images/graph.png`
 * @param inputPath - 
 */
export function getLocalPathWithFileScheme(cm, inputPath) {

  let filePath = ''
  const project = window.state.projects.byId[window.id]

  // First determine user intention:
  // If path starts with `/`, we interpret it as an 
  // absolute path. Which in context of our app, means
  // relative to project directory.
  const isAbsolute = inputPath.charAt(0) === '/'

  if (isAbsolute) {
    filePath = new URL(`file://${project.directory}${inputPath}`).toString()
  } else {
    // Generate relative path using
    const doc = window.files.byId[cm.panel.docId]
    // const docPath = new URL()
    filePath = new URL(inputPath, `file://${doc.path}`).toString()
  }

  return filePath
}

/**
 * Intercept paste event and convert the pasted text into
 * plain text, without line breaks. Called from 
 * contenteditables. We want to paste as plain
 * text into them.
 * From: https://stackoverflow.com/a/12028136
 * @param {*} evt - Paste DOM event
 */
export function pasteAsPlainText(evt) {
  evt.preventDefault()
  let text = evt.clipboardData.getData('text/plain')
  text = text.replace(/(\r\n|\n|\r)/gm, '')
  document.execCommand("insertText", false, text)
}