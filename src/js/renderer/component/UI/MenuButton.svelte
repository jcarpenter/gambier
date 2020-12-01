<script>
  import { menu, openMenu, closeMenu } from '../../StateManager'
  import IconButton from './IconButton.svelte'
  // import Menu from './building-blocks/Menu.svelte'
  import Label from './building-blocks/Label.svelte';
  import GenericTextButton from './building-blocks/GenericTextButton.svelte';
  import { wait } from '../../../shared/utils';
  import { nanoid } from 'nanoid/non-secure'
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let options = []
  export let compact = false
  let div
  // let isOpen = false
  
  // Each MenuButton instance needs a unique id. We use this in the `menu` store to associate the active menu with it's button.
  let id = nanoid()
  
  // Menu
  export let menuType = 'popup' // popup or pulldown
  export let menuWidth = 100
  // let isOpen = false
  let menuItemHeight = 22
  let menuX = 0
  let menuY = 0

  // Label
  export let label = ''
  export let labelPadding = 8
  
  // Button
  export let buttonType = 'text' // text or icon
  export let buttonWidth = 100
  let buttonHeight = compact ? 14 : 22
  $: buttonLabel = options.find((opt) => opt.isChecked)?.label

  // Determine whether the menu is open and targeting this button.
  // Based on: is status 'open', and do coordinates match?
  $: isOpen = $menu.isOpen && $menu.id == id
  // $: console.log(isOpen)

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
  
      // Update menu position variables
      switch (menuType) {
        case 'popup':
          const indexOfFirstCheckedOption = options.findIndex((opt) => opt.isChecked)
          menuX = x + -19
          menuY = y + (indexOfFirstCheckedOption * menuItemHeight) - 5
          break
        case 'pulldown':
          menuX = x
          menuY = buttonType == 'text' ? y + menuItemHeight + 4 : y + menuItemHeight + 9
          break
      }
  
      // Set menu store values
      openMenu({
        id: id, 
        isOpen: true,
        options: options,
        selectedOption: undefined,
        width: menuWidth,
        itemHeight: menuItemHeight,
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
  @import '../../../../styles/_mixins.scss';

  // // Compact
  // .compact {
  //   .button {
  //     height: 14px;
  //     @include label-normal-small;
  //   }
  // }
  .menuButton {
    position: relative;
  }

</style>

<div bind:this={div} class:compact class="menuButton">

  <!-- Menu -->
  {#if isOpen}
    <!-- Popup menus are always same size as the button.-->
    <!-- Pulldown menus can be whatever size we want.-->
    <!-- <Menu {options} width={menuType == 'popup' ? buttonWidth + 14 : menuWidth} itemHeight={menuItemHeight} left={menuX} top={menuY} on:select={onSelect} /> -->
  {/if}

  {#if label}
    <Label label={'Sort'} padding={labelPadding} />
  {/if}

  <!-- Button -->
  {#if buttonType == 'text'}
    <GenericTextButton isActive={isOpen} type={buttonType} width={buttonWidth} height={buttonHeight} label={buttonLabel} on:mousedown={toggleOpenClose} />
  {:else if buttonType == 'icon'}
    <IconButton isActive={isOpen} icon={'--img-arrow-up-arrow-down'} showCaret={false} on:mousedown={toggleOpenClose} />
  {/if}
  
</div>

