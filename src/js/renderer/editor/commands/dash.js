import { Pos } from "codemirror"
import { getModeAndState } from "../editor-utils"

/**
 * Insert frontmatter and position cursor if user has typed third dash
 * on first line of a document that doesn't already have FM.
 * Else, write single dash.
 * @param {*} cm 
 * @returns 
 */
export function dash(cm) {

  // If we're in markdown mode...
  // on first line of the doc...
  // with a single cursor and single selection...
  // and we've typed third dash...
  // and there's no frontmatter yet...
  // ... add frontmatter.

  const ranges = cm.listSelections()
  const multipleSelections = ranges.length > 1
  if (multipleSelections) {
    return CodeMirror.Pass
  }

  const isSingleCursorOnLineZero = 
    ranges[0].anchor.line == 0 && 
    ranges[0].head.line == 0 &&
    ranges[0].anchor.ch == ranges[0].head.ch

  if (!isSingleCursorOnLineZero) {
    return CodeMirror.Pass
  }

  const line = ranges[0].anchor.line
  const { state, mode } = getModeAndState(cm, line)

  if (mode.name !== 'markdown') {
    return CodeMirror.Pass
  }

  const firstCharsOnLine = cm.getLine(line)
  if (firstCharsOnLine == '--') {
    // Insert empty front matter section at start of doc
    // and position cursor inside, ready to enter text.
    cm.replaceRange('---\n\n---\n', Pos(line, 0), Pos(line, cm.getLine(line).length))
    cm.setSelection(Pos(1, 0))
    return
  }

  // Else, ignore (write dash as usual)...
  return CodeMirror.Pass

}