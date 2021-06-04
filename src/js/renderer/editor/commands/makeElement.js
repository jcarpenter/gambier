import { isValidHttpUrl, wait } from "../../../shared/utils"
import { getClipboardContents, getFromAndTo, getModeAndState } from "../editor-utils"
import { getElementsInsideRange } from "../map"

/**
 * Create an element of the selected type at each selection.
 * @param {*} type - Of element. 'link inline', 'citation', etc.
 */
export async function makeElement(cm, type) {

  const clipboard = await getClipboardContents()
  const clipboardIsUrl = isValidHttpUrl(clipboard)
  const ranges = cm.listSelections()
  
  // Edits we'll replace selections with
  let edits = []

  for (const r of ranges) {

    const { from, to, isMultiLine, isSingleCursor } = getFromAndTo(r, true)
    const text = isSingleCursor ? '' : cm.getRange(from, to)
    const { state, mode } = getModeAndState(cm, from.line)
    const elementAtSelection = !isSingleCursor && getElementsInsideRange(cm, from, to, true)

    // If selection isn't inside markdown, we don't want to do anything.
    // So we push the existing text as the edit, and continue to the
    // next range.
    if (mode.name !== 'markdown') {
      edits.push(text)
      continue
    }

    // Else, determine new element to write
    let string = ''
    switch (type) {

      case 'link inline': {
        // If user has selected a bare-url element, use it as the 
        // link url, and leave text blank. Else, if user has a url
        // in the clipboard, use that as link url, and use selected
        // text as the link text. Else, just use selected text as
        // link text, and leave url blank.
        if (elementAtSelection?.type == 'bare-url') {
          string = `[](${text})`
        } else if (clipboardIsUrl) {
          string = `[${text}](${clipboard})`
        } else {
          string = `[${text}]()`
        }
        break
      }

      case 'image inline': {
        // (Same as for link line, plus `!` to make it an image)
        if (elementAtSelection?.type == 'bare-url') {
          string = `![](${text})`
        } else if (clipboardIsUrl) {
          string = `![${text}](${clipboard})`
        } else {
          string = `![${text}]()`
        }
        break
      }

      case 'footnote inline': {
        string = `^[${text}]`
        break
      }

      case 'citation': {
        string = `[@${text}]`
        break
      }
    }

    edits.push(string)
  }

  // Replace selections with edits
  cm.replaceSelections(edits, 'around')

  // Try to select the mark (if only one was created)
  if (!window.state.sourceMode && ranges.length == 1) {
    // Wait a beat for CM to update
    await wait(10)
    const { from } = getFromAndTo(ranges[0])
    const mark = cm.findMarksAt(from)[0]
    if (mark) {
      mark.component.openWizard(true)
    }
  }
}
