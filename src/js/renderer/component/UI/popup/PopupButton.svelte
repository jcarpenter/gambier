<script>
  import { fade, fly } from 'svelte/transition';
  import { css } from '../actions';
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let options = []
  export let compact = false
  export let width = 60

  let height = compact ? 14 : 20

  $: firstChecked = options.find((opt) => opt.isChecked)
  $: label = firstChecked?.label
 
  let isOpen = false
  let isArmed = false
  let isClosing = false
  let selectedOption = {}

  let parentDiv

  /** Toggle the menu open/closed */
  function toggleOpenClose() {
    if (isOpen) {
      isOpen = false
      isArmed = false
    } else {
      open()
    }
  }

  /** Set menu position, then reveal it by setting `isOpen` true. Wait a few beats before "arming" the buttons. We do this so we can 1) click the menu without the mouseup event triggering a selection (within the arming timer window), or 2) press-hold-release to select an item (after the arming timing window is finished).  */
  function open() {
    isClosing = false
    isOpen = true
    setTimeout(() => { isArmed = true }, 400)
  }

  /** On option select, play flash animation, then close the menu. */
  function select(evt, option) {
    if (isArmed) {
      isClosing = true
      evt.target.classList.remove('hover')
      setTimeout(() => { 
        evt.target.classList.add('hover')
        isOpen = false
        isArmed = false
        dispatch('select', {option: option})
      }, 50)
    }
  }

  function setMenuPosition(node) {
    const {x, y} = parentDiv.getBoundingClientRect()
    // const menuY = y + height + 2
    const firstCheckedChild = node.getElementsByClassName('isChecked')[0]
    const offsetY = firstCheckedChild?.offsetTop
    const menuX = x - 13
    const menuY = y - offsetY
    node.style = `left: ${menuX}px; top: ${menuY}px;`
  }

  /** We manually set hover states so we have a bit more control than with plain css :hover. */
  function hoverOn(evt) {
    if (!isClosing) {
      evt.target.classList.add('hover')
    }
  }

  function hoverOff(evt) {
    if (!isClosing) {
      evt.target.classList.remove('hover')
    }
  }


</script>

<style type="text/scss">
  @import '../../../../../styles/_mixins.scss';

  // We need to break the menu out any parent overflow:hidden elements (e.g. a sidebar tab), so we set position relative on the top div, and position fixed on the menu div. Per this tip: https://github.com/w3c/csswg-drafts/issues/4092#issuecomment-595247838

  // Compact
  .compact {
    .button {
      height: 14px;
    }
    .button, 
    .li {
      @include label-normal-small;
    }
  }

  // Normal
  .popupButton {
    --width: 0;
    --height: 0;
    user-select: none;
    width: calc(var(--width) * 1px);
    @include label-normal;
  }

  // Button
  .button {
    position: relative;
    background-color: var(--controlBackgroundColor);
    border-radius: 4px;
    box-shadow: 0 0 0 0.5px rgba(var(--foregroundColor), 0.35) inset, 0 1px 1px 0.5px rgba(var(--foregroundColor), 0.15);
    width: 100%;
    height: calc(var(--height) * 1px);
    box-sizing: border-box;
    display: flex;
    align-items: center;

    // On press, tint whole button dark or light (depending on the mode)
    &.isOpen {
      filter: brightness(0.95);
    }

    .label {
      flex-grow: 1;
      color: var(--labelColor);
      padding: 0 0 1px 9px;
    }

    // Blue background with slight light gradient overlay
    .icon {
      flex-basis: 16px;
      flex-shrink: 0;
      height: 100%;
      background: 
        linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0)), 
        var(--controlAccentColor);
      box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.2) inset;
      border-radius: 0 4px 4px 0;

      .img {
        width: 100%;
        height: 100%;
        background-image: var(--img-chevron-up-down);
        background-size: 8px 12px;
        background-position: center;
        background-repeat: no-repeat;
      }
    }
  }

  .menu {
    // --menuX: 0;
    // --menuY: 0;
    width: calc(var(--width) * 1px);
    position: fixed;
    // left: calc(var(--menuX) * 1px);
    // top: calc(var(--menuY) * 1px);
    z-index: 100;
  }

  ul, li {
    @include list-reset;
  }

  ul {
    @include material-menu;
    border-radius: 6px;
    padding: 4px 0;
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
    height: 18px;
    display: flex;
    align-items: center;
    // padding: 0 6px;
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

<div bind:this={parentDiv} class:compact class="popupButton" use:css={{width, height}} >

  <!-- Menu -->
  {#if isOpen}
    <div 
      class="menu" 
      use:setMenuPosition
      out:fade={{ delay: 100, duration: 250 }} 
    >
      <ul>
        {#each options as option}
          {#if option.label == 'separator'}
            <hr />
          {:else}
            <li 
              class:isChecked={option.isChecked} 
              class:hover={false} 
              on:mouseenter={hoverOn} 
              on:mouseleave={hoverOff} 
              on:mouseup={(evt) => select(evt, option)}
            >
              <span class="checkmark"></span>
              <span class="label">{option.label}</span>
            </li>
          {/if}
        {/each}
      </ul>
    </div>
  {/if}

  <!-- Button -->
  <div class="button" on:mousedown={toggleOpenClose} class:isOpen>
    <span class="label">{label}</span>
    <span class="icon">
      <div class="img"></div>
    </span>
  </div>
</div>

