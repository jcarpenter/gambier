// -------- WIDGET INTERACTIONS -------- //

/**
 * Ensure we can arrow the cursor smoothly from editor text into editable widget. This is called by keymap for arrow key presses. Depending on `direction`, checks if next character is the `start` or `end` of an editable widget, and if yes, positions cursor inside that widget.
 * @param {} direction 
 */
export function arrow(cm, direction) {

  const editorState = cm.getEditorState()
  const inlineElements = editorState.inlineElements

  if (editorState.sourceMode) return CodeMirror.Pass

  const cursor = cm.getCursor()

  let adjacentInlineEl = null

  if (direction == 'toLeft') {
    adjacentInlineEl = inlineElements.find((e) => e.line == cursor.line && e.end == cursor.ch)
  } else if (direction == 'toRight') {
    adjacentInlineEl = inlineElements.find((e) => e.line == cursor.line && e.start == cursor.ch)
  }

  if (adjacentInlineEl && adjacentInlineEl.widget && adjacentInlineEl.widget.editable) {

    const sideWeEnterFrom = direction == 'toLeft' ? 'right' : 'left'
    adjacentInlineEl.widget.arrowInto(sideWeEnterFrom)

  } else {
    return CodeMirror.Pass
  }
}


/**
 * Tab to the previous element in the document
 */
export function tabToPrevElement(cm) {

  const cursor = cm.getCursor()
  const editorState = cm.getEditorState()
  const sourceMode = editorState.sourceMode
  const inlineElements = editorState.inlineElements

  // Create array of "tabbable" elements. These are widgets, unless we're in sourceMode, in which case they're element children (e.g. text, url, title).
  let tabbableElements = []
  if (!sourceMode) {
    tabbableElements = inlineElements.filter((e) => e.widget)
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
    cm.dispatch({ type: 'selectWidget', target: element })
  }
}

/**
 * Tab to the next element in the document.
 */
export function tabToNextElement(cm) {

  const cursor = cm.getCursor()
  const editorState = cm.getEditorState()
  const sourceMode = editorState.sourceMode
  const inlineElements = editorState.inlineElements

  // Create array of "tabbable" elements. These are widgets, unless we're in sourceMode, in which case they're element children (e.g. text, url, title).
  let tabbableElements = []
  if (!sourceMode) {
    tabbableElements = inlineElements.filter((e) => e.widget)
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
    cm.dispatch({ type: 'selectWidget', target: element })
  }
}

/**
 * Make it hard to accidentally delete widgets by selecting them first. User must press again to then actually delete the item.
 * @param {*} keyPressed 
 */
export function backspaceOrDelete(cm, keyPressed = '') {

  const cursor = cm.getCursor()
  const selection = { string: cm.getSelection() }
  const editorState = cm.getEditorState()
  const inlineElements = editorState.inlineElements

  if (selection.string == '') {

    const adjacentWidgetEl = inlineElements.find((e) => e.line == cursor.line && e.widget && cursor.ch >= e.start && cursor.ch <= e.end)

    // Set anchor/head values in `cm.setSelection` to either start/end or end/start, depending on whether the key pressed was backspace or delete (aka: whether the selection is moving backwards or forwards). First `cm.setSelection` argument is `anchor`, and second is `head`. Per: https://codemirror.net/doc/manual.html#setSelection
    
    if (adjacentWidgetEl) {

      const cursorIsOnRight = cursor.ch == adjacentWidgetEl.end
      const cursorIsOnLeft = cursor.ch == adjacentWidgetEl.start  

      if (cursorIsOnRight && keyPressed == 'backspace') {
        // Moving backwarsd: Anchor at end
        cm.setSelection(
          { line: adjacentWidgetEl.line, ch: adjacentWidgetEl.end },
          { line: adjacentWidgetEl.line, ch: adjacentWidgetEl.start }
        )
      } else if (cursorIsOnLeft && keyPressed == 'delete') {
        // Moving forwards: Anchor at start
        cm.setSelection(
          { line: adjacentWidgetEl.line, ch: adjacentWidgetEl.start },
          { line: adjacentWidgetEl.line, ch: adjacentWidgetEl.end }
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