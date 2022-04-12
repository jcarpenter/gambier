/*
Menu is a singleton, driven by:

- Menu.svelte component. One per window. Created by Layout.svelte. Position, contents (etc) are dervied from...
- menu store. Created here, in MenuManager.js. Is updated by closeMenu and openMenu functions, which are by called from both the Menu component, and by...
- Components that use the Menu component, such as PopupButton. They call `openMenu` from their mousedown handlers, and pass in params, which openMenu then applies to the store.

The components react to state changes in the `menu` store. But components do not modify state. Instead they call openMenu and closeMenu, which modify state.
*/


import { writable } from 'svelte/store';
import { state } from './StateManager';

export const menu = writable({
  isOpen: false,
  id: undefined, // Unique ID of the component that opened it
  items: [],
  selectedItem: undefined,
  type: 'pulldown', // 'pulldown' or 'popup'
  compact: false,
  position: { x: 0, y: 0 },
  width: '300px', // In pixesl. E.g. '100px'
})

export function closeMenu(selectedItem) {
  menu.update((oldState) => {
    return {
      ...oldState,
      selectedItem: selectedItem,
      isOpen: false
    }
  })
}


/**
 * Returns current width of button in px. 
 * We set this value to the menu, so it matches.
 */
function getRenderedButtonWidth(node, type, isCompact) {
  let { width } = node.getBoundingClientRect()
  
  // If we're on the mac, we add some padding, 
  // to PopupButtons, to better match the OS look.
  if (window.state.platform == 'mac' && type == 'popup') {
    width += isCompact ? 6 : 12
  }

  return `${width}px`
}


export function openMenu(node, params) {
  const { x, y, width, height } = node.getBoundingClientRect()
  menu.update((oldState) => {
    return {
      ...oldState,
      ...params,
      width: getRenderedButtonWidth(node, params.type, params.compact),
      position: {
        x,
        y: y + height
      },
      isOpen: true
    }
  })
}