<script>
  import { isWindowFocused } from "../../StateManager";
  import { setSize } from "./actions";
  export let label = 'Label'
  export let compact = false
  export let checked = false
  export let disabled = false
  export let margin = '0'
</script>

<style type="text/scss">

  // ------ Layout: Normal ------ //

  .checkbox {
    display: inline-flex;
    vertical-align: top;
    gap: 0 5px;
    min-height: 20px;

    .input { display: flex; }

    // Hide the native input, but keep it accessible to enable focus state, etc. We use `+` sibling selector to style the `.control` element when this is :active.
    input {
      opacity: 0;
      width: 0;
      height: 0;
      margin: 0;
    }

    .control {
      display: grid;
      place-items: center;
      transform: translate(0, 3px);
      width: 14px;
      height: 14px;
      border-radius: 3px;
      // Icon
      &::before {
        content: '';
        @include centered_mask_image;
        width: 100%;
        height: 100%;
        transform: translate(0, 0.5px);
        -webkit-mask-size: 10px;
        -webkit-mask-image: var(--img-checkmark-heavy);
      }
      // Focus ring
      &::after {
        content: '';
        position: absolute;
        border-radius: inherit;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
    }
    
    .label {
      @include label-normal;
      color: var(--labelColor);
      transform: translate(0, 3px);
      user-select: none;
    }
  }

  // ------ Layout: Compact ------ //

  .compact.checkbox {
    gap: 0 4px;
    min-height: 16px;

    .control {
      width: 12px;
      height: 12px;
      border-radius: 2.5px;
      transform: translate(0, 2px);
      &::before {
        -webkit-mask-size: 8px !important;
        transform: translate(0, 0) !important;
      }
      // &:::after {

      // }    
    }

    .label {
      @include label-normal-small;
      transform: translate(0, 1.5px);
    }
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
  // `before` defines checkbox image
  .checked .control {
    background: $btn-accent-bg;

    // Slight bevel on top edge, and dark outline.
    @include dark {
      box-shadow: 
        inset 0 0.5px 0 0 white(0.3), // Bevel
        0 0 0 0.5px black(0.2); // Outline
    }

    // Border is disabled
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
  // Active styles only apply if checkbox is enabled
  // Active, but NOT checked:
  .checkbox:not(.disabled):not(.checked) input:active + .control {
    @include dark { filter: brightness(1.25); }
    @include light { filter: brightness(0.95); }
  }


  // Active and checked:
  .checkbox:not(.disabled).checked input:active + .control {
    @include dark { filter: brightness(1.25); }
    // Light mode: blue background darkens, but not the icon
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
  // Dark icon
  .disabled.checked .control {
    &::before { background: var(--labelColor); }
  }

  .disabled .label {
    opacity: 0.35;
  }

  // ------ Window not focused ------ //
  // Desaturate the checked `.control`.
  .checkbox:not(.windowFocused).checked .control {
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
  class="checkbox" 
  class:compact 
  class:windowFocused={$isWindowFocused} 
  class:disabled
  class:checked
  use:setSize={{margin}}
  on:click>
  <span class="input">
    <input type="checkbox" {disabled} {checked} />
    <span class="control"></span>
  </span>
  <span class="label">{label}</span>
</label>