import { isDescendantOfId, wait } from "../../shared/utils"
import { closeWizard, openWizard, store2 } from "../WizardManager"

export function isPreviewableEl(el) {
  return el.classList.toString().includesAny('link', 'cm-tag', 'image', 'footnote', 'citation', 'figure')
}


export function showPreview(cm, el, metaKey, altKey, cursorCoords) {

  // Return if el is undefined, or we don't care about it
  if (!el) return

  // Return if element isn't previewable
  if (!isPreviewableEl(el)) return

  const charPos = cm.coordsChar({ left: cursorCoords.x, top: cursorCoords.y }, 'window')
  const marks = cm.findMarksAt(charPos)

  // Show preview.
  // What the preview is, and how fast it shows, depends on:
  // 1) type of element
  // 2) how preview was triggered (button press, hover, etc)

  // Marks: 
  // - Hover + Meta: Depends on type. For links, we show URL.
  // - Hover + Alt: Show Wizard immediately
  // - Hover: Show Wizard after short delay
  const isMark = marks && el.classList.toString().includesAny('link', 'image', 'footnote', 'citation', 'figure')

  if (isMark) {
    if (metaKey) {

      // Show preview tooltip w/ element

    } else if (altKey) {


      // Show Wizard immediately
      openWizard(cm, marks[0], false, false, true)

      // Listen for mouse leaving el.
      // We close wizard if conditions are correct.
      onMouseoutCloseWizard(cm, el)

    } else {

      const timer = setTimeout(() => {

        // Show Wizard after short delay
        openWizard(cm, marks[0], false, true, false)

        // Listen for mouse leaving el.
        // We close wizard if conditions are correct.
        onMouseoutCloseWizard(cm, el)

      }, 1000, el)

      // Cancel timer if user mouses out before it goes off
      el.addEventListener('mouseout', (evt) => {
        if (timer) clearTimeout(timer)
      }, { once: true })

    }
    return
  }
}


/**
 * When mouse exits element, close the wizard if the
 * cursor is not -over- the wizard.
 */
function onMouseoutCloseWizard(cm, el) {
  el.addEventListener('mouseout', async (evt) => {
    const cursorCoords = await window.api.invoke('getCursorWindowPosition')
    if (cursorCoords == null) return
    const el = document.elementFromPoint(cursorCoords.x, cursorCoords.y)
    const elOrParentsAreWizard = isDescendantOfId(el, 'wizard')
    if (!elOrParentsAreWizard) {
      closeWizard()
      cm.focus()
    }
  }, { once: true })
}