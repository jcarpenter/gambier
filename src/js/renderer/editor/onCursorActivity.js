/**
 * "Will be fired when the cursor or selection moves, or any change is made to the editor content." - https://codemirror.net/doc/manual.html#event_cursorActivity
 */
export function onCursorActivity(cm, event) {
  // Update cm.state.selections
  cm.dispatch({ type: 'setSelections' })
}
