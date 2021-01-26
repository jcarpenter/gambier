<script>
  import { isWindowFocused } from "../../StateManager";
  import { setSize } from "./actions";

  export let group = undefined
  export let value = undefined
  export let label = ''
  // export let name = ''
  export let compact = false
  export let disabled = false
  export let margin = '0'
  
  // Radio is checked when `group == value`
  $: checked = group == value
</script>

<style type="text/scss">

  // ------ Layout: Normal ------ //

  .radio {
    display: flex;
    gap: 0 5px;
    min-height: 20px;
  
    .input { display: flex; }

    // Hide the native input, but keep it accessible to enable focus state, etc. We use `+` sibling selector to style the `.control` element when this is :active or :checked.
    input {
      opacity: 0;
      width: 0;
      height: 0;
      margin: 0;
    }

    .control {
      display: block;
      transform: translate(0, 3px);
      width: 14px;
      height: 14px;
      border-radius: 50%;
      // Dot
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        border-radius: inherit;
        width: 100%;
        height: 100%;
        transform: scale(0.4);
      }
      // Focus ring
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        border-radius: inherit;
        width: 100%;
        height: 100%;
      }
    }

    .label {
      @include label-normal;
      transform: translate(0, 3px);
      color: var(--labelColor);
      user-select: none;
    } 
  }


  // ------ Layout: Compact ------ //

  .compact.radio {
    // TODO
  }

  // ------ Default ------ //

  .control {
    @include dark {
      background: $dark-inset-btn-bg;
      box-shadow: $dark-inset-btn-outline;
    }
    @include light {
      background: $light-inset-btn-bg;
      box-shadow: $light-inset-btn-outline;
    }
    &::before { opacity: 0; }
  }  


  // ------ Checked ------ //

  .checked .control {
    background: $btn-accent-bg;

    // Slight bevel on top edge, and dark outline.
    @include dark {
      box-shadow: 
        inset 0 0.5px 0 0 white(0.3), // Bevel
        0 0 0 0.5px black(0.2); // Outline
    }

    @include light { 
      box-shadow: none;
    }

    // Icon is always white
    &::before {
      background: white;
      opacity: 1;
    }
  }

  // ------ Focused ------ //

  // TODO: We only want to enable if 'Use keyboard navigation to move focus between controls' is enabled in System Preferences > Keyboard. We don't know how to detect that, thought.
  // input:focus + .control {
  //   &::after { 
  //     @include setFocus; 
  //   }
  // }

  // ------ Active ------ //
  // Active styles only apply if radio is enabled
  // Active, but NOT checked:
  .radio:not(.disabled):not(.checked) input:active + .control {
    @include dark { filter: brightness(1.25); }
    @include light { filter: brightness(0.95); }
  }

  // Active and checked:
  .radio:not(.disabled).checked input:active + .control {
    // Same as not checked
    @include dark { filter: brightness(1.25); }
    // Blue background darkens, but not the dot
    @include light { 
      background: 
        linear-gradient(black(0.15), black(0.15)), // Darken
        $btn-accent-bg;
    }
  }


  // ------ Disabled ------ //
  // Disabled, but NOT checked
  .disabled .control {
    opacity: 0.6;
    &::before { opacity: 0.5; }
    @include dark {
      background: $dark-inset-btn-bg;
      box-shadow: $dark-inset-btn-outline;
    }
    @include light {
      background: $light-inset-btn-bg;
      box-shadow: $light-inset-btn-outline;
    }
  }

  // Disabled and checked
  // Dark dot
  .disabled.checked .control {
    &::before { background: var(--labelColor); }
  }

  .disabled .label {
    opacity: 0.35;
  }


  // ------ Window not focused ------ //
  // Desaturate the checked `.control`.
  .radio:not(.windowFocused).checked .control {
    // Desaturated background. White dot.
    @include dark {
      background: $dark-inset-btn-bg;
      box-shadow: $dark-inset-btn-outline;
    }
    // White background. Dark dot.
    @include light {
      background: $light-inset-btn-bg;
      box-shadow: $light-inset-btn-outline;
    }
    &::before { background: var(--labelColor); }
  }
</style>

<label 
  class="radio" 
  class:compact 
  class:checked
  class:windowFocused={$isWindowFocused}
  use:setSize={{margin}}
  on:click
  > 
  <span class="input">
    <input type="radio" bind:group value={value}>
    <span class="control"></span>
  </span>
  <span class="label">{label}</span>
</label>
