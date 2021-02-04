<script>
  import { isWindowFocused } from "../../StateManager";
  import { setSize } from "./actions";

  export let label = ''
  export let compact = false
  export let emphasized = false
  export let disabled = false
  export let width = '100px'
  export let margin = '0'

</script>

<style type="text/scss">

  // ------ Layout: Normal ------ //

  button {
    @include label-normal;
    color: var(--labelColor);
    border: none;
    outline: none;
    height: 20px;
    padding: 0;
    border-radius: $border-radius-normal;
    .label {
      user-select: none;
      transform: translate(0, -0.5px);
    }
  }


  // ------ Layout: Compact ------ //

  button.compact {
    @include label-normal-small;
    height: 16px;
    border-radius: $border-radius-compact;
    .label {
      line-height: 16px;
      height: 16px;
    }
  }

  // ------ Default ------ //

  button:not(.emphasized) {
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

  button.emphasized {
    color: white;
    background: $btn-accent-bg;
    @include dark {
      box-shadow: $dark-btn-outline;
    }
  }

  // ------ Focused ------ //

  // ------ Active ------ //
  // Active styles only apply if button is enabled
  button:active:not(.disabled) {

    // Add accent gradient (if it's not already there)
    color: white;
    background: $btn-accent-bg;

    @include dark { filter: brightness(1.25); }

    @include light { 
      filter: brightness(0.9); 
      box-shadow: none; // Hide outline
    }
  }

  // ------ Disabled ------ //
  .disabled {
    opacity: 0.35;
  }

  // ------ Window not focused ------ //
  // PushButton `emphasized` takes on look of non-emphasized version, 
  // when window is not focused.
  button.emphasized:not(.windowFocused) {
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

</style>

<button
  class:compact 
  class:disabled
  class:emphasized
  class:windowFocused={$isWindowFocused}
  use:setSize={{width, margin}}
  on:mousedown
  >
  <div class="label">{label}</div>
</button>