// -------- MARK INTERACTIONS -------- //

/**
 * Ensure we can arrow the cursor smoothly from editor text into editable mark. This is called by keymap for arrow key presses. Depending on `direction`, checks if next character is the `start` or `end` of an editable mark, and if yes, positions cursor inside that mark.
 * @param {} direction 
 */
export function arrow(cm, direction) {

  const inlineElements = cm.state.inlineElements

  if (cm.state.sourceMode) return CodeMirror.Pass

  const cursor = cm.getCursor()

  let adjacentInlineEl = null

  if (direction == 'toLeft') {
    adjacentInlineEl = inlineElements.find((e) => e.line == cursor.line && e.end == cursor.ch)
  } else if (direction == 'toRight') {
    adjacentInlineEl = inlineElements.find((e) => e.line == cursor.line && e.start == cursor.ch)
  }

  if (adjacentInlineEl && adjacentInlineEl.mark && adjacentInlineEl.mark.editable) {

    const sideWeEnterFrom = direction == 'toLeft' ? 'right' : 'left'
    adjacentInlineEl.mark.arrowInto(sideWeEnterFrom)

  } else {
    return CodeMirror.Pass
  }
}


/**
 * Tab to the previous element in the document
 */
export function tabToPrevElement(cm) {

  const cursor = cm.getCursor()
  const sourceMode = cm.state.sourceMode
  const inlineElements = cm.state.inlineElements

  // Create array of "tabbable" elements. These are marks, unless we're in sourceMode, in which case they're element children (e.g. text, url, title).
  let tabbableElements = []
  if (!sourceMode) {
    tabbableElements = inlineElements.filter((e) => e.mark)
  } else {
    inlineElements.forEach((e) => {
      e.children.forEach((c) => {
        if (!c.collapsed && !c.classes.includes('md')) tabbableElements.push(c)
      })
    })
  }

  const element = tabbableElements.slice().reverse().find((e) =>
    e.line <= cursor.line &&
    // If entity is on same line as cursor, look backwards from current cursor ch.
    // Else, look backwards from end of line.
    e.end < (e.line == cursor.line ? cursor.ch : cm.getLineHandle(e.line).text.length)
  )

  // Find the closest tabbable element before the cursor.
  if (element) {
    // cm.setSelection({ line: element.line, ch: element.start }, { line: element.line, ch: element.end }, { scroll: true })
    cm.dispatch({ type: 'selectMark', target: element })
  }
}

/**
 * Tab to the next element in the document.
 */
export function tabToNextElement(cm) {

  const cursor = cm.getCursor()
  const sourceMode = cm.state.sourceMode
  const inlineElements = cm.state.inlineElements

  // Create array of "tabbable" elements. These are marks, unless we're in sourceMode, in which case they're element children (e.g. text, url, title).
  let tabbableElements = []
  if (!sourceMode) {
    tabbableElements = inlineElements.filter((e) => e.mark)
  } else {
    inlineElements.forEach((e) => {
      e.children.forEach((c) => {
        if (!c.collapsed && !c.classes.includes('md')) tabbableElements.push(c)
      })
    })
  }

  // Find the next tabbable element
  const element = tabbableElements.find((e) =>
    e.line >= cursor.line &&
    // If entity is on same line as cursor, look forward from current cursor ch.
    // Else, look forward from start of line (zero).
    e.start >= (e.line == cursor.line ? cursor.ch : 0)
  )

  // Select and focus the element
  if (element) {
    // cm.setSelection({ line: element.line, ch: element.start }, { line: element.line, ch: element.end }, { scroll: true })
    cm.dispatch({ type: 'selectMark', target: element })
  }
}

/**
 * Make it hard to accidentally delete marks by selecting them first. User must press again to then actually delete the item.
 * @param {*} keyPressed 
 */
export function backspaceOrDelete(cm, keyPressed = '') {

  const cursor = cm.getCursor()
  const selection = { string: cm.getSelection() }
  const inlineElements = cm.state.inlineElements

  if (selection.string == '') {

    const adjacentMarkEl = inlineElements.find((e) => e.line == cursor.line && e.mark && cursor.ch >= e.start && cursor.ch <= e.end)

    // Set anchor/head values in `cm.setSelection` to either start/end or end/start, depending on whether the key pressed was backspace or delete (aka: whether the selection is moving backwards or forwards). First `cm.setSelection` argument is `anchor`, and second is `head`. Per: https://codemirror.net/doc/manual.html#setSelection
    
    if (adjacentMarkEl) {

      const cursorIsOnRight = cursor.ch == adjacentMarkEl.end
      const cursorIsOnLeft = cursor.ch == adjacentMarkEl.start  

      if (cursorIsOnRight && keyPressed == 'backspace') {
        // Moving backwarsd: Anchor at end
        cm.setSelection(
          { line: adjacentMarkEl.line, ch: adjacentMarkEl.end },
          { line: adjacentMarkEl.line, ch: adjacentMarkEl.start }
        )
      } else if (cursorIsOnLeft && keyPressed == 'delete') {
        // Moving forwards: Anchor at start
        cm.setSelection(
          { line: adjacentMarkEl.line, ch: adjacentMarkEl.start },
          { line: adjacentMarkEl.line, ch: adjacentMarkEl.end }
        )
      } else {
        return CodeMirror.Pass
      }
    } else {
      return CodeMirror.Pass
    }
  } else {
    return CodeMirror.Pass
  }
}