<script lang='js'>
  import { isWindowFocused, state } from "../../StateManager";
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

  let el // This element

  $: tabindex = $state.system.keyboardNavEnabled ? 0 : -1

  // Set label text to the checked option
  $: label = items.find((i) => i.checked)?.label

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

</script>

<style lang="scss">

.popupButton {
    @include button;
    padding: 0 2px 0 8px;
    .label {
      justify-content: left;
    }
  }

  .popupButton.compact {
    @include button-compact;
    padding: 0 2px 0 6px;
  }

  .popupButton:focus {
    @include button-focus;
  }

  .popupButton:enabled:active,
  .popupButton.menuOpen {
    // @include button-active;
    // We darken the button slightly
    @include dark { filter: brightness(1.25); }
    @include light { filter: brightness(0.9); }
  }

  .popupButton:disabled {
    @include button-disabled;
  }

  .popupButton.windowHidden {
    @include button-windowHidden;
  }

  .popupButton .icon::before {
    -webkit-mask-image: var(--popupButton-icon);
  }
  
  :global([slot="description"]) {
    @include button-description;
  }

  
</style>

<button
  class="popupButton button"
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
      type: 'popup',
      compact: compact
    })
  }}
  on:keydown={(evt) => {
    if (evt.code.equalsAny('Space', 'ArrowUp', 'ArrowDown')) {
      openMenu(evt.target, {
        id: id,
        items: items,
        type: 'popup',
        compact: compact
      })
    }
  }}
>
  <div class="label">{label}</div>
  <div class="icon"></div>
</button>

{#if $$slots}
  <span class="description"></span>
  <slot name="description"></slot>
{/if}