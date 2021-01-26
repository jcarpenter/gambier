import { writable } from "svelte/store";

export const tooltip = writable({ 
  status: 'hide', // 'show', 'hide', or 'hideAfterDelay'
  text: '', 
  x: 0, 
  y: 0 
})

/**
 * Tooltip is a singleton component attached to the top-level component for each window. We store a reference to it in the StateManager (as a `tooltip` store). And we update it's value here. NOTE: If the parent component is not enabled, we don't show the tooltip.
 * @param {*} node 
 * @param {*} params - Object: `{ text: 'Hello!', enabled: true }`
 */
export function setTooltip(node, params) {

  // Set text value
  const { text } = params

  // Set initial `enabled` value. This is updated in `update` function.
  let enabled = params.enabled

  function onMouseEnter(evt) {
    if (!enabled) return
    tooltip.set({
      status: 'show',
      text: text,
      x: evt.clientX,
      y: evt.clientY + 4
    })
  }

  function onMouseDown() {
    if (!enabled) return
    tooltip.set({
      status: 'hide',
      text: '',
      x: 0,
      y: 0
    })
  }

  function onMouseLeave(evt) {
    if (!enabled) return
    tooltip.set({
      status: 'hideAfterDelay',
      text: '',
      x: 0,
      y: 0
    })
  }

  node.addEventListener('mouseenter', onMouseEnter);
  node.addEventListener('mousedown', onMouseDown);
  node.addEventListener('mouseleave', onMouseLeave);

  return {
    update(newParams) {
      enabled = newParams.enabled
    },
    
    destroy() {
      node.removeEventListener('mouseenter', onMouseEnter);
      node.removeEventListener('click', onMouseDown);
      node.removeEventListener('mouseleave', onMouseLeave);
    }
  }
}

