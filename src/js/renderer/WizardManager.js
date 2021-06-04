/*
(Note: this is same pattern as Menu)
Wizard is a singleton, driven by:
- Wizard.svelte component. One per window. Created by Layout.svelte. Position, contents (etc) are dervied from...
- `wizard` store. Created here. Is updated by `close` and `open` functions, which are by called by...
- Components that use the Wizard component. E.g. Editor components. They call `open` when the user interacts with the code in a way that requires the wizard, and pass in arguments for the CodeMirror instance, a TextMarker, etc
- WizardManager updates `wizard` store.
- Wizard gets the changes, and responds.
*/

import { writable, get } from 'svelte/store';
import { isDescendantOfClass, isDescendantOfId } from '../shared/utils';
import { getElementAt } from './editor/map';
import { state } from './StateManager';

/**
   * Return true if the hovered element triggers the wizard
   * @param {*} el 
   * @returns 
   */
export function doesHoveredElementTriggerWizard(el, metaKey, altKey) {

  if (el.classList.length == 0) return false
  if (el.classList.toString().includes('CodeMirror')) return false

  if (metaKey) {

    // These elements trigger wizard when meta key is down
    // E.g. Hold meta and hover link to see preview of url.
    if (el.classList.toString().includesAny('link', 'figure', 'image')) return true
    if (el.classList.toString().includes('tag') && isDescendantOfClass(el, 'frontmatter')) return true
    return false

  } else if (altKey) {

    // These elements trigger wizard when alt key is down
    // Holding alt and hovering one of the following generally 
    // just shows wizard immediately (without the delay you 
    // get when hovering without alt).
    if (el.classList.contains('mark')) return true
    return el.classList.toString().includesAny('citation', 'footnote', 'link', 'figure', 'image')

  } else {

    // These elements trigger wizard when hovering
    // Usually this means showing the wizard after a brief delay.
    // List should be same as under `altKey`, above.
    if (el.classList.contains('mark')) return true
    return el.classList.toString().includesAny('citation', 'footnote', 'link', 'figure', 'image')

  }
}

/**
 * User is hovering an element that triggers the wizard.
 * Show the wizard immediately if meta or alt keys are down.
 * Otherwise, show after a brief delay.
 * @param {object} el - DOM element
 * @param {boolean} metaKey 
 * @param {boolean} altKey 
 */
export function onHoverElementThatTriggersWizard(cm, el, metaKey, altKey) {

  const showImmediately = metaKey || altKey

  if (showImmediately) {

    // Show wizard immediately...

    const { left, top } = el.getBoundingClientRect()
    const pos = cm.coordsChar({ left, top })
    const element = getElementAt(cm, pos.line, pos.ch, undefined, true)

    store2.setTarget({
      cm,
      panelId: cm.panel.id,
      domElement: el,
      element,
      openedBy: { tabOrClick: false, hover: true, metaKey, altKey }
    })

    onMouseoutCloseWizard(cm, el)

  } else {

    // Show wizard after brief delay...
    store2.setTargetAfterTimer(cm, el, 1000, () => {

      // This function is called after timer completes.
      // It needs to return the values that we'll set target to
      // First though, we set listener for mouseout on DOM element
      // that triggered the wizard opening. When cursor leaves it,
      // we want to close the wizard.
      onMouseoutCloseWizard(cm, el)

      const { left, top } = el.getBoundingClientRect()
      const pos = cm.coordsChar({ left, top })
      const element = getElementAt(cm, pos.line, pos.ch, undefined, true)

      // `setTargetAfterTimer` updates store with this as new value:
      return {
        cm,
        panelId: cm.panel.id,
        domElement: el,
        element,
        openedBy: { tabOrClick: false, hover: true, metaKey: false, altKey: false }
      }
    })
  }
}

/**
 * We've opened the wizard because user has hovered an element.
 * Create listener for mouseout from the element. When 
 * fired, if the now-hovered element is NOT the wizard,
 * close the wizard. If it is the wizard, leave it open.
 * @param {*} el 
 */
export function onMouseoutCloseWizard(cm, el) {
  el.addEventListener('mouseout', async (evt) => {
    // const cursorCoords = await window.api.invoke('getCursorWindowPosition')
    // if (cursorCoords == null) return
    // const hoveredEl = document.elementFromPoint(cursorCoords.x, cursorCoords.y)
    // const hoveredEl = document.elementFromPoint(evt.clientX, evt.clientY)
    // const hoveredElOrParentsAreWizard = isDescendantOfId(hoveredEl, 'wizard')
    const hoveredElOrParentsAreWizard = isDescendantOfId(evt.toElement, 'wizard')
    // If whatever element is currently being hovered is
    // not the wizard, close the wizard.
    if (!hoveredElOrParentsAreWizard) {
      store2.close()
      // cm.focus()
    }
  }, { once: true })
}

/**
 * On moueover of CM, check if we should open the wizard.
 * Open IF it's not already open, and underyling element
 * meets criteria (and other various conditions.)
 * @param {*} evt 
 * @returns 
 */
export function onMouseOverCheckIfWeShouldOpenWizard(cm, evt) {

  // If wizard is already open, return
  if (isWizardOpen) return

  // If hovered element does not trigger wizard, return
  const elementTriggersWizared = doesHoveredElementTriggerWizard(evt.target, evt.metaKey, evt.altKey)
  if (!elementTriggersWizared) return

  // Call `onHoverElementThatTriggersWizard`.
  // It tells Wizard to open.
  onHoverElementThatTriggersWizard(cm, evt.target, evt.metaKey, evt.altKey)
}

/**
 * On keydown, if user pressed alt or meta keys, we want to open
 * the wizard. We also cancel an the timer if it's active.
 */
 export async function onKeyDownCheckIfWeShouldOpenWizard(cm, evt) {

  // If user types while timer is active, cancel the timer.
  // E.g. User clicks mouse inside mark with intent to type.
  // We don't want wizard to appear while they're typing.
  // So we cancel the timer.
  if (isTimerActive) store2.cancelTimer()

  // If wizard is already open, or meta or alt key was NOT
  // pressed, return.
  if (isWizardOpen) return
  if (!evt.metaKey && !evt.altKey) return

  // Get cursor x/y position inside window
  const cursorCoords = await window.api.invoke('getCursorWindowPosition')
  const cursorIsOutsideWindow = cursorCoords == null

  // If cursor is outside window, return
  if (cursorIsOutsideWindow) return

  // If hovered element is does not trigger wizard, return
  const el = document.elementFromPoint(cursorCoords.x, cursorCoords.y)
  if (!doesHoveredElementTriggerWizard(el, evt.metaKey, evt.altKey)) return

  // Forward to function to call wizard
  onHoverElementThatTriggersWizard(cm, el, evt.metaKey, evt.altKey)
}

/**
 * On keyup, if user released meta or alt keys, and wizard is visible
 * we MAY want to close the wizard. 
 * @param {*} evt 
 */
export function onKeyUpCheckIfWeShouldCloseWizard(cm, evt) {

  // If wizard NOT open, or meta or alt key NOT released, return.
  if (!isWizardOpen) return
  if (!evt.key == 'Alt' && !evt.key == 'Meta') return

  // Get current Wizard store value
  const store2Value = get(store2)

  // If wizard was opened by alt key or meta key,
  // and the released key matches one of those two,
  // then close the wizard.

  // NOTE: This will not fire when we're editing wizard,
  // because wizard will have focus, and cm `keydown`
  // listener (which calls this function) will not fire.

  if (evt.key == 'Alt' && store2Value.openedBy.altKey) {
    // store2.close()
    // Do nothing. Let wizard stay open.
  } else if (evt.key == 'Meta' && store2Value.openedBy.metaKey) {
    store2.close()
  }
}


let timerToSetTarget = undefined
export let isTimerActive = false


/**
 * Expose wizard's `isVisible` state as variable for other JS modules.
 * We update this inside store methods.
 */
export let isWizardOpen = false

function createStore2() {

  const state = {

    // Target-specific values:

    cm: undefined, // The CM instance that opened the wizard.
    panelId: undefined,
    domElement: null, // Of target
    element: null, // Of target

    // Wizard-specific values:

    isVisible: false,
    suppressWarnings: false, // An option used to suppress error warnings (e.g. when user first creates a mark, and the fields are empty).
    openedBy: {
      tabOrClick: false, // If user opens wizard by tabbing or clicking an element
      hover: false, // If user opens wizard by hovering a mark (without alt pressed), we want to close the wizard when they mouse out of the wizard.
      metaKey: false, // Was metaKey down? If user opens wizard by pressing alt while hovering a mark, we want to close the wizard when they release alt, if the cursor is outside the wizard.
      altKey: false // Was altKey down?
    }

  }

  const { subscribe, set, update } = writable(state);

  const methods = {

    setTargetAfterTimer(cm, el, timerDuration, getNewValuesFunc) {

      // Once timer finished, set new values
      timerToSetTarget = setTimeout(() => {
        this.setTarget(getNewValuesFunc())
      }, timerDuration)

      // Set timer active boolean
      isTimerActive = true

      // Cancel timer if user mouses out from element before timer finishes
      el.addEventListener('mouseout', (evt) => {
        if (isTimerActive) this.cancelTimer()
      }, { once: true })
    },

    cancelTimer() {
      clearTimeout(timerToSetTarget)
      isTimerActive = false
    },

    setTarget(values) {

      // Cancel timer, if it's active
      if (isTimerActive) this.cancelTimer()

      // Update store
      update((oldState) => ({
        ...oldState,
        ...values,
        isVisible: true
      }))

      // Update `isWizardOpen` value
      isWizardOpen = true
    },

    close() {
      
      // Cancel timer, if it's active
      if (isTimerActive) this.cancelTimer()

      // Update store
      update(oldState => ({
        ...oldState,
        domElement: null,
        element: null,
        isVisible: false
      }))
      
      // Update `isWizardOpen` value
      isWizardOpen = false
    },
  }

  return {
    subscribe,
    ...methods
  }
}

export const store2 = createStore2()