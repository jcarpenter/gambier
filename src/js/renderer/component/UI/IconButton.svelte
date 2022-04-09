<script lang='js'>
  import { isWindowFocused, state } from "../../StateManager";
  import { menu, openMenu } from "../../MenuManager";
  import { setTooltip } from "../../TooltipManager";
  import { setAsCustomPropOnNode, setSize } from "./actions";
  import { nanoid } from 'nanoid/non-secure'
  import { createEventDispatcher } from 'svelte';

  $: tabindex = $state.system.keyboardNavEnabled ? 0 : -1

  const dispatch = createEventDispatcher();

  export let icon = 'prefs-tab-media-icon' // CSS url, or name of CSS variable that defines icon.
  export let tooltip = undefined // E.g. 'Select syntax'
  export let compact = false
  export let disabled = false
  export let padding = '0 10px'
  export let margin = '0'
  export let iconScale = 1 // Use to tweak size of icon
  export let showBackgroundOnHover = true // Use to disable showing background on hover
  export let showBackgroundOnClick = true // Use to disable showing background on hover

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

<style lang="scss">

  .iconButton {
    -webkit-app-region: no-drag;
    display: inline-flex;
    vertical-align: top;
    align-items: center;
    justify-content: center;
    outline: none;
    border: 0;
    min-width: 28px;
    min-height: 28px;
    border-radius: var(--button-border-radius);
    flex: none;
    background: none;
    
    .icon {
      @include centered-mask-image;
      background: foregroundColor(0.6);
      pointer-events: none;
      width: 18px;
      height: 18px;
      transform: scale(var(--iconScale));
    }
  
    .caret {
      @include centered-mask-image;
      background: foregroundColor(0.6);
      pointer-events: none; 
      margin: 0 -2px 0 8px;
      width: 8px;
      height: 8px;
      -webkit-mask-image: var(--iconbutton-chevron-icon);
    }
  }

  .iconButton.compact {
    min-width: 24px;
    min-height: 24px;
    .icon {
      width: 16px;
      height: 16px;
    }
  }

  .iconButton.menuOpen, 
  .iconButton:enabled:hover {
    .caret {
      background: var(--label-color);
    }
  }

  .iconButton.showBackgroundOnHover:enabled:hover {
    background: foregroundColor(0.04);
  }

  .iconButton:focus {
    @include focusRingAnimation;
  }

  .iconButton.showBackgroundOnClick:enabled:active {
    background: foregroundColor(0.08);
  }

  .iconButton:disabled {
    opacity: 0.35;
  }

  .iconButton.windowHidden {
    opacity: 0.5;
  }



</style>

{#if items}

  <button 
    class="iconButton"
    class:compact 
    disabled={disabled}
    tabindex={tabindex}
    class:showBackgroundOnHover
    class:showBackgroundOnClick
    class:windowHidden={!$isWindowFocused}
    class:menuOpen={$menu.isOpen && $menu.id == id}
    use:setAsCustomPropOnNode={{iconScale}}
    use:setSize={{margin, padding}}
    use:setTooltip={{text: tooltip, enabled: !disabled}} 
    on:mousedown|preventDefault={(evt) => {
      if (disabled) return
      dispatch('mousedown', evt.detail)
      openMenu(evt.target, {
        id: id,
        items: items,
        type: 'pulldown',
        width: menuWidth,
        compact: compact
      })
    }}
    on:keydown={(evt) => {
      if (evt.code == 'Space') {
        openMenu(evt.target, {
          id: id,
          items: items,
          type: 'pulldown',
          width: menuWidth,
          compact: compact
        })
      }
    }}
  >
    <div class="icon" style={`-webkit-mask-image: var(--${icon});`} />
    {#if showCaret}
      <div class="caret" />
    {/if}
  </button>

{:else}

  <button
    class="iconButton"
    class:compact 
    disabled={disabled}
    tabindex={tabindex}
    class:showBackgroundOnHover
    class:showBackgroundOnClick
    class:windowHidden={!$isWindowFocused}
    use:setAsCustomPropOnNode={{iconScale}}
    use:setSize={{margin, padding}}
    use:setTooltip={{text: tooltip, enabled: !disabled}} 
    on:mousedown|preventDefault
    on:mouseup
  >
    <div class="icon" style={`-webkit-mask-image: var(--${icon});`} />
  </button>

{/if}