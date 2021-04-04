import { isValidHttpUrl, wait } from "../../../shared/utils"
import { getClipboardContents, getFromAndTo } from "../editor-utils"
import { getElementsInsideRange } from "../map"

/**
 * Create an element of the selected type at each selection.
 * @param {*} type - Of element. 'link inline', 'citation', etc.
 */
export async function makeElement(cm, type) {

  const selections = cm.listSelections()

  cm.operation(() => {
    selections.forEach(async (s) => {

      const { from, to } = getFromAndTo(s, true)
      const isSingleCursor = from.line == to.line && from.ch == to.ch
      const text = isSingleCursor ? '' : cm.getRange(from, to)
      const elementAtSelection = !isSingleCursor && getElementsInsideRange(cm, from, to, true)
      const clipboard = await getClipboardContents()
      const clipboardIsUrl = isValidHttpUrl(clipboard)

      // Determine new element to write
      let newEl = ''
      switch (type) {

        case 'link inline': {
          // If user has selected a bare-url element, use it as the 
          // link url, and leave text blank. Else, if user has a url
          // in the clipboard, use that as link url, and use selected
          // text as the link text. Else, just use selected text as
          // link text, and leave url blank.
          if (elementAtSelection?.type == 'bare-url') {
            newEl = `[](${text})`
          } else if (clipboardIsUrl) {
            newEl = `[${text}](${clipboard})`
          } else {
            newEl = `[${text}]()`
          }
          break
        }

        case 'image inline': {
          // (Same as for link line, plus `!` to make it an image)
          if (elementAtSelection?.type == 'bare-url') {
            newEl = `![](${text})`
          } else if (clipboardIsUrl) {
            newEl = `![${text}](${clipboard})`
          } else {
            newEl = `![${text}]()`
          }
          break
        }

        case 'footnote inline': {
          newEl = `^[${text}]`
          break
        }

        case 'citation': {
          newEl = `[@${text}]`
          break
        }
      }

      cm.replaceRange(newEl, from, to)

      // const isElementsAtCursor = getElementsAt()
      // const isSelectedTextInsideAnotherElement =
      //   !isSingleCursor &&
      //   getElementAt(cm, from.line, from.ch) !== undefined

    })
  })

  // Try to select the mark (if one was created)
  if (!window.state.sourceMode && selections.length == 1) {
    // Wait a beat for CM to update
    await wait(10)
    const { from } = getFromAndTo(selections[0])
    const mark = cm.findMarksAt(from)[0]
    if (mark) {
      mark.component.openWizard(true)
    }
  }
}