import { getElementAt } from "./map"
import { markElement } from "./mark"

export function onCursorActivity(cm) {
  
  // console.log('onCursorActivity')
  // console.log(cm.listSelections())

  // Check for outstanding marks.
  // We use bookmark marks to flag elements that need to be
  // marked when the cursor moves outside them. This happens
  // when we create a mark, and the cursor is still inside
  // it. We delay creating the mark until the user cursors
  // outside the bounds.

  const marks = cm.getAllMarks()
  const bookmarks = marks.filter((m) => m.type == 'bookmark' && m.isSpotToMark)
  if (bookmarks) {
    bookmarks.forEach((b) => {
      const { line, ch } = b.find()
      const elementAtBookmark = getElementAt(cm, line, ch)
      const cursor = cm.getCursor()
      const cursorIsOutsideElement = 
        cursor.line !== elementAtBookmark?.line ||
        cursor.ch < elementAtBookmark?.start + 1 ||
        cursor.ch > elementAtBookmark?.end - 1
      const needsMark = 
        elementAtBookmark?.mark.isMarkable && 
        cursorIsOutsideElement
      if (needsMark) {
        markElement(cm, elementAtBookmark)
        b.clear()
      }
    })
  }
}
