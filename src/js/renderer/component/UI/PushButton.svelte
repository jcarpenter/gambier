<script>
  import { isWindowFocused, state } from "../../StateManager";
  import { setSize } from "./actions";

  export let label = ''
  export let compact = false
  export let disabled = false
  export let width = '100px'
  export let margin = '0'

  $: tabindex = $state.system.keyboardNavEnabled ? 0 : -1

</script>

<style type="text/scss">

  .pushButton {
    @include button;
  }

  .pushButton.compact {
    @include button-compact;
  }

  .pushButton:focus {
    @include button-focus;
  }
    
  .pushButton:enabled:active {
    @include button-active;
  }

  .pushButton:disabled {
    @include button-disabled;
  }

  .pushButton.windowHidden {
    @include button-windowHidden;
  }

  :global([slot="description"]) {
    @include button-description;
  }

  // ------ Window not focused ------ //
  // PushButton `emphasized` takes on look of non-emphasized version, 
  // when window is not focused.
  // .pushButton.emphasized:not(.windowFocused) {
  //   color: var(--button-label-color);
  //   @include dark { 
  //     background: $dark-btn-bg;
  //     box-shadow: $dark-btn-outline;
  //   }
  //   @include light { 
  //     background: $light-btn-bg;
  //     box-shadow: $light-btn-outline;
  //   }
  // }

</style>

<button
  class="pushButton button"
  class:compact 
  disabled={disabled}
  tabindex={tabindex}
  class:windowHidden={!$isWindowFocused}
  use:setSize={{width, margin}}
  on:mousedown|preventDefault
  >
  <div class="label">{label}</div>
</button>

<!-- Optional description slot -->
{#if $$slots.description}
  <slot name="description"></slot>
{/if}