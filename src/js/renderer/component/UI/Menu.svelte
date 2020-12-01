<script>
  import { menu, closeMenu, selectMenuOption } from '../../StateManager'
  import { fade } from 'svelte/transition';
  import { css } from './actions';
  import { createEventDispatcher } from 'svelte';
  import { wait } from '../../../shared/utils';

  let isOpen = false
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
    console.log(wasOpenIsClosed)

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
  function updateValues() {
    isOpen = $menu.id
    isOpen = $menu.isOpen
    options = $menu.options
    width =  $menu.width
    itemHeight = $menu.itemHeight
    x = $menu.x
    y = $menu.y
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
    
    const clickedInside = evt.clientX > x && evt.clientX < x + w && evt.clientY > y && evt.clientY < y + h
    
    
    if (!clickedInside) {
      closeMenu()
    }
  }

</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  // We need to break the menu out any parent overflow:hidden elements (e.g. a sidebar tab), so we set position relative on the top div, and position fixed on the menu div. Per this tip: https://github.com/w3c/csswg-drafts/issues/4092#issuecomment-595247838
  
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
    @include material-menu;
    border-radius: 6px;
    padding: 5px;
    transform: translate(0, 0);
    overflow: hidden;
    box-shadow: 
      0 0 0 0.5px rgba(var(--foregroundColor), 0.2), 
      0 0 3px 0 rgba(var(--foregroundColor), 0.1), 
      0 5px 11px 0 rgba(var(--foregroundColor), 0.28);
  }

  li {
    @include label-normal;
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
    width: 9px;
    height: 9px;
    opacity: 0;
  }

  .label {
    color: var(--labelColor);
    opacity: 0.76;
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
    border: 1px solid var(--separatorColor);
    margin: 4px 0;
  }


</style>

<svelte:window on:mousedown={() => { if (isOpen) checkIfClickedOutsideTheMenu }} />

{#if isOpen}
  <div 
    class="menu" 
    bind:clientWidth={w} bind:clientHeight={h}
    use:css={{width, itemHeight, x, y}}
    out:fade={{ duration: 250 }} 
  >
    <ul>
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