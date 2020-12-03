<script>
  import { menu, openMenu, closeMenu } from '../../StateManager'
  import IconButton from './IconButton.svelte'
  import Label from './building-blocks/Label.svelte';
  import GenericTextButton from './building-blocks/GenericTextButton.svelte';
  import { wait } from '../../../shared/utils';
  import { nanoid } from 'nanoid/non-secure'
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let options = []
  export let isCompact = false
  export let tooltip = ''
  export let label = ''
  export let buttonType = 'text' // text or icon
  export let buttonWidth = 100
  export let menuType = 'popup' // popup or pulldown
  export let menuWidth = buttonWidth
  export let labelPadding = 8

  // Each MenuButton instance needs a unique id. 
  // We use this in the `menu` store to associate the active menu with it's button.
  let id = nanoid()
  let div
  
  // Label text is the checked option
  $: buttonLabel = options.find((opt) => opt.isChecked)?.label

  // Determine whether the menu is open and targeting this button.
  // Based on: is status 'open', and do coordinates match?
  $: isOpen = $menu.isOpen && $menu.id == id

  /** 
   * Toggle the menu open/closed. Set menu position, then reveal it by setting `isOpen` true.
   */
  function toggleOpenClose(evt) {

    // Stop propagation, or else we trigger mousedown in Menu.svelte body listener, which will close the menu as soon as it opens.
    evt.stopPropagation()

    if (isOpen) {
      closeMenu()
    } else if (!isOpen) {
        
      // Get element position
      const {x, y} = div.getBoundingClientRect()
      let menuX = x
      let menuY = y

      // Set menu store values
      openMenu({
        id: id, 
        isOpen: true,
        isCompact: isCompact,
        buttonType: buttonType,
        menuType: menuType,
        options: options,
        selectedOption: undefined,
        // If buttonType is 'text', we want menu to match button, plus some padding.
        width: buttonType == 'text' ? buttonWidth + (isCompact ? 6 : 12) : menuWidth,
        x: menuX,
        y: menuY
      })
    }
  }

  $: $menu.selectedOption, onSelect()

  async function onSelect() {
    if ($menu.isOpen || $menu.id !== id || !$menu.selectedOption) return
    await wait(100)
    dispatch('select', {option: $menu.selectedOption})
  }

</script>

<style type="text/scss">
  .menuButton {
    position: relative;
  }
</style>

<div bind:this={div} class="menuButton">

  {#if label}
    <Label label={'Sort'} padding={labelPadding} />
  {/if}

  <!-- Button -->
  {#if buttonType == 'text'}
    <GenericTextButton {isCompact} isActive={isOpen} type={menuType} width={buttonWidth} label={buttonLabel} on:mousedown={toggleOpenClose} />
  {:else if buttonType == 'icon'}
    <IconButton {tooltip} isActive={isOpen} icon={'--img-arrow-up-arrow-down'} showCaret={false} on:mousedown={toggleOpenClose} />
  {/if}
  
</div>

