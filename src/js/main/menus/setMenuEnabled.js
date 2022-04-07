import { Menu } from 'electron'

/**
 * Disable all child menu items of the specified menu
 * @param appMenu - Instance of the top-level app menu
 * @param id - Menu ID. E.g. "view-sourceMode"
 * @param enabled - Boolean
 */
export function setMenuEnabled(id, enabled) {
  const appMenu = Menu.getApplicationMenu()
  const menu = appMenu.getMenuItemById(id)
  if (menu.type !== "submenu") return
  const childItems = Object.values(menu.submenu.commandsMap)
  childItems.forEach((child) => {
    child.enabled = enabled
    // Handle grand-children also
    // TODO: Tried running this recursively but hit infinite loop. 
    // Fix. As-is, this only goes one level deep.
    if (child.type == "submenu") {
      Object.values(child.submenu.commandsMap).forEach((grandchild) => grandchild.enabled = enabled)
    }
  })
}
