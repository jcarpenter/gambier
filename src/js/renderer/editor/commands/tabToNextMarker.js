import { Pos } from "codemirror"
import { getElementAt } from "../map"
import markTaskList from "../markTaskList"

export function tabToNextMarker(cm) {
  const cursor = cm.getCursor('from')
  // const marks = cm.getAllMarks().filter((m) => !m.collapsed)
  const lastLine = cm.lastLine()
  // Get all marks between cursor and end of doc
  // Filter out collapsed and/or formatting marks
  const marks = cm.findMarks(cursor, Pos(lastLine, cm.getLine(lastLine).length)).filter((m) => !m.collapsed)
  
  const nextMark = marks.find((m) => {
    const { from, to } = m.find()
    const markIsOnSameLineAndGreaterCh =
      from.line == cursor.line &&
      from.ch > cursor.ch
    const isOnSubsequentLine = 
      from.line > cursor.line
    // console.log(markIsOnSameLineAndGreaterCh, isOnSubsequentLine)
    return markIsOnSameLineAndGreaterCh || isOnSubsequentLine
  })

  
  const { from, to } = nextMark.find()
  const el = getElementAt(cm, from.line, from.ch)
  console.log(el)
  cm.setSelection(Pos(el.line, el.start), Pos(el.line, el.end))
  // cm.setSelection(from, Pos(to.line, to.ch))
  console.log(from)
  console.log(cursor)
  // Find next non-collapsed mark
  // const 

}