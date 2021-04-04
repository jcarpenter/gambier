import { wasUrlClicked } from "./wasUrlClicked"

/**
 * Open URL when user keys 'Cmd-Enter', if a span with a url is selected.
 * NOTE: Only works if there is one selection active in the doc.
 * Behind the scenes, we re-use logic from `wasUrlClicked`.
 */
export function wasUrlEntered(cm) {

  const activeSelections = cm.listSelections()

  // Return if there are multiple selections, or no selection.
  if (activeSelections.length > 1) return CodeMirror.Pass

  const selectionPos = activeSelections[0].anchor

  wasUrlClicked(cm, selectionPos)

}

