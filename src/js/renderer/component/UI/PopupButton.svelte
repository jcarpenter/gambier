<script>
  import { isWindowFocused } from "../../StateManager";
  import { menu, openMenu } from "../../MenuManager";
  import { setSize } from "./actions";
  import { nanoid } from 'nanoid/non-secure'
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let items = []
  export let compact = false
  export let disabled = false
  export let width = '100px'
  export let margin = '0'

  // Set label text to the checked option
  $: label = items.find((i) => i.checked)?.label

  $: height = compact ? '16px' : '20px'
  
  // For text buttons like PopupButton and PulldownButton, we want the menu width to match the button's, plus some padding.
  $: menuWidth = `${parseInt(width) + (compact ? 6 : 12)}px`

  // Unique ID. Used to match menu with component that opens it.
  let id = nanoid() 

  // Was a selection made? If yes, dispatch event. Criteria is: when `menu` store changes, is it: 1) closed, 2) set to this component instance's `id`, and 3) set to a valid `selectedItem` value (not undefined)
  $: $menu, checkForMenuSelection() 
  
  function checkForMenuSelection() {
    
    const selectionWasMade = !$menu.isOpen && $menu.id == id && $menu.selectedItem

    if (selectionWasMade) {
      dispatch('selectItem', { item: $menu.selectedItem })
    }
  }

</script>

<style type="text/scss">

  // ------ Layout: Normal ------ //

  button {
    @include label-normal;
    display: inline-flex;
    align-items: center;
    color: var(--labelColor);
    border: none;
    outline: none;
    height: 20px;
    padding: 2px;
    padding-left: 8px;
    border-radius: $border-radius-normal;
  }

  .label {
    flex-grow: 1;
    display: flex;
    align-items: center;
    text-align: left;
    overflow: hidden;
    word-wrap: none;
    user-select: none;
    line-height: 20px;
    transform: translate(0, -0.5px);
    pointer-events: none;
  }

  // Icon (bluesquare with image inside)
  .icon {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    display: grid;
    place-items: center;
    pointer-events: none;

    // Icon image
    &::before {
      content: '';
      @include centered_mask_image;
      width: 100%;
      height: 100%;
      transform: translate(0, 0.5px);
      -webkit-mask-size: 8px auto;
      -webkit-mask-image: var(--img-chevron-up-down);
    }
  }



  // ------ Layout: Compact ------ //

  button.compact {
    @include label-normal-small;
    height: 16px;
    padding-left: 6px;
    border-radius: $border-radius-compact;
    .label {
      line-height: 16px;
    }
    .icon {
      width: 12px;
      height: 12px;
      border-radius: 2.5px;

      &::before {
        transform: translate(0, 0);
        -webkit-mask-size: auto 10px;
      }
    }
  }


  // ------ Default ------ //

  button {
    color: var(--labelColor);
    
    @include dark {
      background: $dark-btn-bg;
      box-shadow: $dark-btn-outline;
    }

    @include light { 
      background: $light-btn-bg;
      box-shadow: $light-btn-outline;
    }
  }

  .icon {
    background: $btn-accent-bg;
    // Dark also has top bevel and slight outline
    @include dark {
      box-shadow: 
        inset 0 0.5px 0 0 white(0.25),
        0 0 0 0.5px black(0.15);
    }
    // TODO: box-shadow
    &::before {
      background: white;
    }
  }

  // ------ Focused ------ //

  // ------ Active ------ //
  // Active styles apply when button is pressed, and/or menu is open.
  button.menuOpen,
  button:active:not(.disabled) {
    @include dark { filter: brightness(1.25); }
    @include light { filter: brightness(0.9); }
  }

  // ------ Disabled ------ //
  // Same styles as window-not-focused, plus lower opacity.
  .disabled {
    opacity: 0.35;
    .icon {
      background: none;
      box-shadow: none;
      &::before {
        background: var(--labelColor);
      }
    }
  }

  // ------ Window not focused ------ //
  button:not(.windowFocused) .icon {
    background: none;
    box-shadow: none;
    &::before {
      background: var(--labelColor);
    }
  }

</style>

<button
  class:compact 
  class:disabled
  class:menuOpen={$menu.isOpen && $menu.id == id}
  class:windowFocused={$isWindowFocused}
  use:setSize={{width, height, margin}}
  on:mousedown={(domEvent) => {
    if (disabled) return
    openMenu(domEvent.target, {
      id: id,
      items: items,
      type: 'popup',
      width: menuWidth,
      compact: compact
    })
  }}
>
  <div class="label">{label}</div>
  <div class="icon"></div>
</button>