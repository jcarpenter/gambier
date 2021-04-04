import { getLineClasses, getLineSpans, getTopAndBottomLines } from "../editor-utils"

/**
 * Toggle task list item(s). 
 * TODO: Convert to new system
 */
export function toggleTaskChecked(cm) {
  if (cm.getOption('disableInput')) return CodeMirror.Pass
  const ranges = cm.listSelections()
  // For each selection...
  ranges.forEach((range) => {
    const { topLine, bottomLine } = getTopAndBottomLines(range)
    // For each line selected...
    for (var line = topLine; line <= bottomLine; line++) {
      // If the line is in a task list...
      const lineHandle = cm.getLineHandle(line)
      const lineClasses = getLineClasses(lineHandle)
      const isTaskList = lineClasses.includes('task')
      if (!isTaskList) continue
      // Toggle the open/closed value...
      const spans = getLineSpans(cm, lineHandle)
      const span = spans.find((s) => s.classes.includes('task'))
      cm.replaceRange(
        span.element.isClosed ? ' ' : 'x',
        { line, ch: span.start + 1 },
        { line, ch: span.start + 2 }
      )
    }
  })
  return CodeMirror.Pass
}
