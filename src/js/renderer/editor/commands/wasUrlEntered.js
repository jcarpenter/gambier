import { Pos } from "codemirror"
import { getFromAndTo } from "../editor-utils"
import { wasUrlClicked } from "./wasUrlClicked"

/**
 * Open URL when user keys 'Cmd-Enter', if a span with a url is selected.
 * NOTE: Only works if there is one selection active in the doc.
 * Behind the scenes, we re-use logic from `wasUrlClicked`.
 */
export function wasUrlEntered(cm) {

  const ranges = cm.listSelections()

  // Return if there are multiple selections, or no selection.
  if (ranges.length > 1 || !cm.somethingSelected()) return CodeMirror.Pass

  const { from } = getFromAndTo(ranges[0], true)
  
  // Pass to `wasUrlClicked` to handle the rest.
  // Give it the from.ch, plus one character (so
  // we're looking inside the selection).
  wasUrlClicked(cm, Pos(from.line, from.ch + 1))

}

