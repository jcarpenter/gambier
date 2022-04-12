import { Pos } from "codemirror"
import { getFromAndTo, getModeAndState } from "../editor-utils"
import { getLineClasses } from "../map"

/**
 * Toggle task list item(s). 
 */
export function toggleTaskChecked(cm) {

  const ranges = cm.listSelections()
  let edits = []

  for (const r of ranges) {

    const { state, mode } = getModeAndState(cm, r.anchor.line)
    const { from, to, isMultiLine, isSingleCursor } = getFromAndTo(r, true)
    if (mode.name !== 'markdown') continue

    for (var i = from.line; i <= to.line; i++) {

      const lineHandle = cm.getLineHandle(i)
      const lineClasses = getLineClasses(lineHandle)
      const isTaskList = lineClasses.includes('taskList')

      if (isTaskList) {
        const lineText = cm.getLine(i)
        const ch = lineText.indexOf('[') + 1
        const type = cm.getTokenTypeAt(Pos(i, ch))
        const text = type.includes('task-closed') ? ' ' : 'x'
        cm.replaceRange(text, Pos(i, ch), Pos(i, ch + 1), '+input')
      }
      
      // 5/10/2021: Previous state-based approach. Had to move away from 
      // this once we stopped marking state.list after first character
      // (in markdown.js).

      // const { state, mode } = getModeAndState(cm, i)
      // if (mode.name !== 'markdown') continue

      // if (state.taskList) {
      //   const lineText = cm.getLine(i)
      //   const ch = lineText.indexOf('[') + 1
      //   const type = cm.getTokenTypeAt(Pos(i, ch))
      //   const text = type.includes('task-closed') ? ' ' : 'x'
      //   cm.replaceRange(text, Pos(i, ch), Pos(i, ch + 1), '+input')
      // }
    }
  }
}
