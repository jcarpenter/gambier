<script>
  import { createEventDispatcher } from "svelte";
  import { wait } from '../../../shared/utils';
  import { closeMenu, menu } from "../../MenuManager";
  import { isWindowFocused } from "../../StateManager";
  import { setSize } from './actions';
  import { tick } from 'svelte';

  const dispatch = createEventDispatcher();

  let isOpen = false
  let id = ''
  let items = []
  let selectedItem = undefined
  let type = 'pulldown'
  let compact = false
  let position = { x: 0, y: 0}
  let width = '0px'

  let isLive = false
  let isClosing = false
  let self // `ul` dom element

  $: selectedIndex = undefined // tracks which item is 'selected' (hovered, arrowed-to, etc)
  
   $: $menu, determineState()

   async function determineState() {

    const wasClosedIsOpen = !isOpen && $menu.isOpen
    const wasOpenIsClosed = isOpen && !$menu.isOpen

    if (wasClosedIsOpen) {
      isLive = false
      updateValues()
      await tick();
      setPosition()
      open()
    } else if (wasOpenIsClosed) {
      // updateValues()
      isOpen = false
    }
  }

  /**
   * Upate local copies of store values. These values drive local reactivity, and are used to determine what changed in state.
   */
   function updateValues() {

    isOpen = $menu.isOpen
    id = $menu.id
    items = $menu.items
    type = $menu.type
    compact = $menu.compact
    position = $menu.position
    width = $menu.width
  }

  /**
   * Set position, depending on the menu type. Popups appear with the checked item positioned directly over the button. Pulldowns appeaar below the button.
   */
   async function setPosition() {
    if (!self) return
    const { x, y } = position
    if (type == 'pulldown') {
      self.style.top = `${y}px`
      self.style.left = `${x}px`
    } else if (type == 'popup') {
      const checkedEl = self.querySelector('.checked')
      self.style.top = `${y - checkedEl.offsetTop - checkedEl.offsetHeight}px`
      self.style.left = `${x - checkedEl.offsetLeft - (compact ? 6 : 12)}px`
    }
  }

  /**
   * Wait a few beats before "arming" the buttons. We do this so we can 1) click the menu without the mouseup event triggering a selection (within the arming timer window), or 2) press-hold-release to select an item (after the arming timing window is finished).
  */
  async function open() {
    selectedIndex = undefined // So nothing is selected, at first.
    isClosing = false
    await wait(250)
    isLive = true
  }

  /**
   * On item selected, play exit animation, then call `closeMenu` to update store `isOpen` state.
   */
   async function selectItem(selectedItem) {

    isClosing = true

    const selectedEl = self.querySelector('.hover')

    // Flash hover state on/off
    selectedEl.classList.remove('hover')
    await wait(60)
    selectedEl.classList.add('hover')

    // Fade out menu
    const animation = self.animate([
      { opacity: 1 },
      { opacity: 0 },
    ], 250)
    
    // Update store
    animation.onfinish = () => {
      closeMenu(selectedItem)
    }
  }

  
  /**
   * Triggered by `keydown` on window. Lets the user interact with the menu via the keyboard.
   */
  function onKeydown(domEvent) {
    if (!isOpen || !isLive || isClosing) return
    domEvent.preventDefault()

    switch (domEvent.code) {
      case 'Escape':
        closeMenu(undefined)
        break
      case 'Enter':
        const selectedItem = items[selectedIndex]
        selectItem(selectedItem)
        break
      case 'ArrowUp':
        if (selectedIndex > 0) {
          selectedIndex--
        } else if (selectedIndex == undefined) {
          selectedIndex = items.length - 1
        }
        break
      case 'ArrowDown':
        if (selectedIndex < items.length - 1) {
          selectedIndex++
        } else if (selectedIndex == undefined) {
          selectedIndex = 0
        }
        break
    }
  }

</script>

<style type="text/scss">

  // ------ Cover ------ //

  #menuCover {
    position: fixed;
    width: 100%;
    height: 100%;
    background: transparent;
    z-index: 99;
  }

  // ------ Visibility ------ //

  .menu.isOpen {
    display: block;
  }

  .menu:not(.isOpen) {
    display: none;
  }

  // ------ Layout: Normal ------ //

  .menu {
    @include list-reset;
    position: fixed;
    user-select: none;
    z-index: 100;
    overflow: hidden;
    backdrop-filter: blur(8px);
    border-radius: 5.5px;
    padding: 5px;

    li {
      @include label-normal;
      cursor: default;
      white-space: nowrap;
      display: flex;
      align-items: center;
      outline: none;
      border-radius: 4px;
      height: 22px;

      // Checkmark
      &::before {
        content: '';
        @include centered_mask_image;
        display: inline-block;
        width: 9px;
        height: 9px;
        // transform: translate(0, -0.5px);
        margin: 0 5px 0 5px;
        -webkit-mask-size: contain;
        -webkit-mask-image: var(--img-checkmark-heavy);
      }
    }

    // Separator
    hr {
      border: none;
      border-bottom: 1px solid var(--separatorColor);
      margin: 5px 10px;
      // pointer-events: none;
    }
  }

  // ------ Layout: Compact ------ // 

  .menu.compact {
    li {
      height: 20px;
      border-radius: 3.5px;
    }
  }

  // ------ Default ------ //
  .menu {
    @include dark { 
      background: gray(17%, 0.9);
      border: 1px solid white(0.2);
      box-shadow:
        0 0 0 0.5px black(1);
    }
    @include light { 
      background: gray(95%, 0.8);
      box-shadow: 
        inset 0 0.5px 0 0 white(0.5), // Top bevel
        0 0 0 0.5px black(0.12), // Outline
        0 5px 16px 0 black(0.2); // Drop shadow
    }
  }

  li {
    color: var(--labelColor);
    &::before { 
      opacity: 0;
      background: var(--labelColor);
    }
  }

  // ------ Checked ------ //
  
  li.checked {
    &::before { opacity: 1; }
  }

  // ------ Hover ------ //
  li.hover {
    background-color: var(--controlAccentColor);
    color: white;
    &::before { background: white; }
  }

  // ------ Disabled ------ //
  // ------ Window not focused ------ //

</style>

<svelte:options accessors={true}/>

<svelte:window on:keydown={onKeydown} />

<ul
  class="menu"
  class:isOpen
  class:compact
  bind:this={self}
  use:setSize={{width}}
  on:mouseleave={() => {
    if (isClosing) return
    selectedIndex = undefined
  }}
>
  {#each items as item, index}
    <li
      class:checked={item.checked}
      class:hover={index == selectedIndex}
      on:mouseenter={() => {
        if (isClosing) return 
        selectedIndex = index
      }}
      on:mouseup={() => {
        if (!isLive) return
        selectItem(item)
      }}
      >
      {item.label}
    </li>
    {#if item.separatorAfter}
      <hr on:mouseenter={() => {
        if (isClosing) return
        selectedIndex = undefined
      }}/>
    {/if}
  {/each}
</ul>

<!--  
Close the menu when the user clicks outside the menu. NOTE: If the user clicks the button that opened the menu, that will also close the menu. The button logic will handle the close action and stop event propagation, and this code path will not be reached. If we don't take this approach, this code will close the menu as soon as it's opened.
-->
{#if isOpen && isLive}
  <div 
    id="menuCover"
    on:mousedown={() => {
      // Call `closeMenu` to update store `isOpen` state
      closeMenu(undefined)
    }}
  >
  </div>
{/if}