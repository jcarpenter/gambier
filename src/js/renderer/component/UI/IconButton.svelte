<script>
  import { isWindowFocused } from "../../StateManager";
  import { menu, openMenu } from "../../MenuManager";
  import { setTooltip } from "../../TooltipManager";
  import { css, setSize } from "./actions";
  import { nanoid } from 'nanoid/non-secure'
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let icon = 'img-photo'
  export let tooltip = undefined
  export let compact = false
  export let disabled = false
  export let padding = '0 10px'
  export let margin = '0'
  export let iconScale = 1 // Use to tweak size of icon

  // ------ Menu-related variables ------ //

  // If `items` is not undefined, the button toggles a menu.
  // Showing a caret is optional. 
  export let items = undefined // Array of menu items
  export let showCaret = false
  export let menuWidth = '100px'
  
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
    -webkit-app-region: no-drag;
    display: inline-flex;
    vertical-align: top;
    align-items: center;
    justify-content: center;
    outline: none;
    border: 0;
    outline: 0;
    min-width: 28px;
    min-height: 28px;
    border-radius: $border-radius-normal;
    flex: none;

    .icon {
      @include centered_mask_image;
      pointer-events: none;
      width: 18px;
      height: 18px;
      transform: scale(var(--iconScale));
    }
  
    .caret {
      @include centered_mask_image;
      pointer-events: none; 
      margin: 0 -2px 0 8px;
      width: 8px;
      height: 8px;
      -webkit-mask-image: var(--img-chevron-down-heavy);
    }
  }

  // ------ Layout: Compact ------ //

  button.compact {
    min-width: 24px;
    min-height: 24px;
    .icon {
      width: 16px;
      height: 16px;
    }
  }

  // ------ Default ------ //
  button {
    background: none;
    .icon,
    .caret {
      background: rgba(var(--foregroundColor), 0.6);
    }
  }
  
  // ------ Hover ------ //
  // Show background and brighten caret on hover (and when menu is open)
  button.menuOpen, 
  button:not(.disabled):hover {
    background: rgba(var(--foregroundColor), 0.04);
    .caret {
      background: var(--labelColor);
    }
  }

  // ------ Active ------ //
  // Active styles apply when button is pressed
  button:not(.disabled):active {
    background: rgba(var(--foregroundColor), 0.08);
  }

  // ------ Disabled ------ //
  // Faded out
  button.disabled {
    opacity: 0.35;
  }

  // ------ Window not focused ------ //
    // Faded out
  button:not(.windowFocused) {
    opacity: 0.5;
  }
</style>

{#if items}

  <button 
    class:compact 
    class:disabled
    class:menuOpen={$menu.isOpen && $menu.id == id}
    class:windowFocused={$isWindowFocused}
    use:css={{iconScale}}
    use:setSize={{margin, padding}}
    use:setTooltip={{text: tooltip, enabled: !disabled}} 
    on:mousedown={(domEvent) => {
      if (disabled) return
      openMenu(domEvent.target, {
        id: id,
        items: items,
        type: 'pulldown',
        width: menuWidth,
        compact: compact
      })
    }}
  >
    <div class="icon" style={`-webkit-mask-image: var(--${icon});`} />
    {#if showCaret}
      <div class="caret" />
  {/if}
  </button>

{:else}

  <button 
    class:compact 
    class:disabled
    class:windowFocused={$isWindowFocused}
    use:css={{iconScale}}
    use:setSize={{margin, padding}}
    use:setTooltip={{text: tooltip, enabled: !disabled}} 
    tabindex="0" 
    on:mousedown
    on:mouseup
  >
    <div class="icon" style={`-webkit-mask-image: var(--${icon});`} />
  </button>

{/if}