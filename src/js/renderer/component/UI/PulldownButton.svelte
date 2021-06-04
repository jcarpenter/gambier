<script>
  import { isWindowFocused, state } from "../../StateManager";
  import { menu, openMenu } from "../../MenuManager";
  import { setSize } from "./actions";
  import { nanoid } from 'nanoid/non-secure'
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let label = 'Label'
  export let items = []
  export let compact = false
  export let disabled = false
  export let width = '100px'
  export let margin = '0'

  let el // This element

  $: tabindex = $state.system.keyboardNavEnabled ? 0 : -1

  // Unique ID. Used to match menu with component that opens it.
  let id = nanoid() 

  $: $menu, checkForMenuSelection() 

  /**
   * Was a selection made? If yes, dispatch event. Criteria is: 
   * when `menu` store changes, is it: 1) closed, 2) set to this 
   * component instance's `id`, and 3) set to a valid 
   * `selectedItem` value (not undefined)
   */
  function checkForMenuSelection() {
    const selectionWasMade = !$menu.isOpen && $menu.id == id && $menu.selectedItem
    if (selectionWasMade) {
      dispatch('selectItem', { item: $menu.selectedItem })
    }
  }

  /**
   * Returns current width of button in px. 
   * We set this value to the menu, so it matches.
   * We ad some padding to better match the mac.
   * TODO 4/16: Will need to abstract this for windows...
   */
   function getRenderedButtonWidth() {
    const { width } = el.getBoundingClientRect()
    return `${width}px`
  }

</script>

<style type="text/scss">

  // ------ Mac ------ //

  :global(.mac) {

    .pulldownButton {
      @include button;
      padding: 0 2px 0 8px;
      .label {
        justify-content: left;
      }
    }
  
    .pulldownButton.compact {
      @include button-compact;
      padding: 0 2px 0 6px;
    }
  
    .pulldownButton:focus {
      @include button-focus;
    }

    .pulldownButton:enabled:active,
    .pulldownButton.menuOpen {
      // @include button-active;
      // We darken the button slightly
      @include dark { filter: brightness(1.25); }
      @include light { filter: brightness(0.9); }
    }

    .pulldownButton:disabled {
      @include button-disabled;
    }

    .pulldownButton.windowHidden {
      @include button-windowHidden;
    }

    .pulldownButton .icon::before {
      -webkit-mask-image: var(--pulldownButton-icon);
    }

    :global([slot="description"]) {
      @include button-description;
    }
  }

  
  // ------ Windows ------ //
  
  :global(.win) {
    // TODO
  } 


</style>

<button
  class="button pulldownButton"
  class:compact 
  class:disabled
  disabled={disabled}
  tabindex={tabindex}
  class:menuOpen={$menu.isOpen && $menu.id == id}
  class:windowHidden={!$isWindowFocused}
  use:setSize={{width, margin}}
  bind:this={el}
  on:mousedown|preventDefault={(evt) => {
    openMenu(evt.target, {
      id: id,
      items: items,
      type: 'pulldown',
      compact: compact
    })
  }}
  on:keydown={(evt) => {
    if (evt.code.equalsAny('Space', 'ArrowUp', 'ArrowDown')) {
      openMenu(evt.target, {
        id: id,
        items: items,
        type: 'pulldown',
        compact: compact
      })
    }
  }}
>
  <div class="label">{label}</div>
  <div class="icon"></div>
</button>

<!-- Optional description slot -->
{#if $$slots.description}
  <slot name="description"></slot>
{/if}