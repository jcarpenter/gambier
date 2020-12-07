<script>
  import { menu, closeMenu, selectMenuOption } from '../../StateManager'
  import { fade } from 'svelte/transition';
  import { css } from './actions';
  import { wait } from '../../../shared/utils';
  import { tick } from 'svelte';
  let ul // binds to <ul> element

  let id = ''
  let isOpen = false
  let isCompact = false
  let options = []
  let width = 0
  let itemHeight = 0
  let x = 0
  let y = 0
  let w = 0
  let h = 0

  let isLive = false
  let isClosing = false

  /**
   * When menu store changes, we need to determine what to do, based on menu store. 
   * Possible states: 
   * - Was closed, and is now open
   * - Was already open, and has a new target
   * - Was open, and is now closed
   */

   $: $menu, determineState()

  function determineState() {

    const wasClosedIsOpen = !isOpen && $menu.isOpen
    const wasOpenHasNewTarget = isOpen && $menu.isOpen && id !== $menu.id
    const wasOpenIsClosed = isOpen && !$menu.isOpen

    if (wasClosedIsOpen) {
      updateValues()
      isLive = false
      open()
    } else if (wasOpenHasNewTarget) {
      updateValues()
    } else if (wasOpenIsClosed) {
      updateValues()
    }
  }

  /**
   * Upate local copies of store values. These values drive local reactivity, and are used to determine what changed in state.
   */
  async function updateValues() {
    id = $menu.id
    isOpen = $menu.isOpen
    isCompact = $menu.isCompact
    options = $menu.options
    width =  $menu.width
    itemHeight = isCompact ? 18 : 21 // If isCompact, tighten height
    await tick();
    x = getX()
    y = getY()
  }

  /**
   * Menu position depends on several factors:
   * - Type of menu (e.g. popup or pulldown)
   * - Type of button (e.g. text or icon)
   * - Whether it's compact or not
   */
  function getX() {
    if ($menu.menuType == 'popup') {
      return $menu.x + (isCompact ? -13 : -20)
    } else {
      return $menu.x
    }
  }

  function getY() {

    const selectedItem = ul.querySelector('.isChecked')

    if ($menu.menuType == 'popup') {
      return $menu.y - selectedItem.offsetTop
    } else {
      return $menu.y + itemHeight
    }
  }

  /**
   * Wait a few beats before "arming" the buttons. We do this so we can 1) click the menu without the mouseup event triggering a selection (within the arming timer window), or 2) press-hold-release to select an item (after the arming timing window is finished).
  */
  async function open() {
    isClosing = false
    await wait(150)
    isLive = true
  }
  
  /** 
   * On option select, play flash animation, then close the menu. pointerEvents none disables the hover states. Then we add the isClosing class, which has the same styles as the hover state. This creates the appearance of the item flashing on/off.
  */
  async function select(evt, option) {
    if (!isLive) return
    isClosing = true
    evt.target.classList.remove('hover')
    await wait(50)
    evt.target.classList.add('hover')
    selectMenuOption(option)
  }

  /**
   * Close the menu when the user clicks outside the menu. NOTE: If the user clicks the button that opened the menu, that will also close the menu. The button logic will handle the close action and stop event propagation, and this code path will not be reached. If we don't take this approach, this code will close the menu as soon as it's opened.
   */
  function checkIfClickedOutsideTheMenu(evt) {

    if (!isOpen) return
    
    const clickedInside = evt.clientX > x && evt.clientX < x + w && evt.clientY > y && evt.clientY < y + h
    
    if (!clickedInside) {
      closeMenu()
    }
  }

</script>

<style type="text/scss">

  // We need to break the menu out any parent overflow:hidden elements (e.g. a sidebar tab), so we set position relative on the top div, and position fixed on the menu div. Per this tip: https://github.com/w3c/csswg-drafts/issues/4092#issuecomment-595247838
  
  // Compact
  .menu.isCompact {
    @include label-normal-small;

    .checkmark {
      margin: 0 5px 0 4px;
      width: 7px;
      height: 7px;
    }
    // hr {
    //   margin: 2px 0;
    // }
  }

  .menu {
    @include label-normal;
    user-select: none;
    width: calc(var(--width) * 1px);
    position: fixed;
    transform: translate(
      calc(var(--x) * 1px), 
      calc(var(--y) * 1px)
    );
    z-index: 100;
  }

  ul, li {
    @include list-reset;
  }

  ul {
    // Drives most of the styling for the menu, including background color!
    @include material-menu;
    border-radius: 6px;
    padding: 5px;
    transform: translate(0, 0);
    overflow: hidden;
    box-shadow: 
      0 0 0 0.5px rgba(var(--foregroundColor), 0.15), 
      0 0 3px 0 rgba(var(--foregroundColor), 0.1), 
      0 5px 16px 0 rgba(var(--foregroundColor), 0.20);
  }

  li {
    cursor: default;
    white-space: nowrap;
    height: calc(var(--itemHeight) * 1px);
    display: flex;
    align-items: center;
    border-radius: 4px;
    outline: none;

    * {
      pointer-events: none;
    }
  }

  .checkmark {
    @include centered_mask_image;
    -webkit-mask-image: var(--img-checkmark);
    background-color: var(--controlTextColor);
    display: inline-block;
    margin: 0 7px 0 6px;
    padding: 0;
    width: 10px;
    height: 10px;
    opacity: 0;
  }

  .label {
    color: var(--labelColor);
    opacity: 1;
  }

  li.hover {
    background-color: var(--controlAccentColor);
    .checkmark {
      background-color: var(--controlColor);
    }
    .label {
      color: var(--controlColor);
      opacity: 1;
    }
  }

  li.isChecked {
    .checkmark {
      opacity: 1;
    }
  }

  hr {
    border: none;
    border-bottom: 1px solid var(--separatorColor);
    margin: 4px 0;
  }


</style>

<svelte:window on:mousedown={checkIfClickedOutsideTheMenu} />

{#if isOpen}
  <div 
    class="menu" 
    class:isCompact
    bind:clientWidth={w} bind:clientHeight={h}
    use:css={{width, itemHeight, x, y}}
    out:fade={{ duration: 250 }} 
  >
    <ul bind:this={ul}>
      {#each options as option}
        {#if option.label == 'separator'}
          <hr />
        {:else}
          <li 
            class:hover={false}
            class:isChecked={option.isChecked} 
            on:mousedown|preventDefault
            on:mouseenter={(evt) => {
              if (isClosing) return
              evt.target.classList.add('hover')
            }}
            on:mouseout={(evt) => evt.target.classList.remove('hover')}
            on:mouseup={(evt) => select(evt, option)}
            tabindex="0"
          >
            <span class="checkmark"></span>
            <span class="label">{option.label}</span>
          </li>
        {/if}
      {/each}
    </ul>
  </div>
{/if}