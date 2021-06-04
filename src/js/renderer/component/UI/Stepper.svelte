<script>
  import { isWindowFocused, state } from "../../StateManager";
  import { setSize } from "./actions";

  export let label = ''
  export let min = 0
  export let max = 5
  export let value = 3

  export let compact = false
  export let disabled = false
  export let width = '40px'
  export let margin = '0'

  $: tabindex = $state.system.keyboardNavEnabled && !disabled ? 0 : -1

  $: value, onValueChanged() 
  
  function onValueChanged() {
    // console.log('Value =', value)
  }

  function up() {
    if (!disabled && value < max) value++
  }

  function down() {
    if (!disabled && value > min) value--
  }

</script>

<style type="text/scss">

  // ------ Layout: Normal ------ //

  .stepper {

    display: flex;
    gap: 0 5px;
    min-height: 20px;

    // Wrapper for the input element. We only need this for the focus ring.
    // Because the focus ring relies on ::after pseudo element, and we 
    // can't create pseudo elements on input elements.
    // Per: https://stackoverflow.com/a/4660434
    .input { 
      // Focus ring
      position: relative;
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

    input {
      @include system-regular-font;
      margin: 0;
      height: 20px;
      outline: none;
    }
    
    .buttons {
      // margin: 5px;
      display: flex;
      flex-direction: column;
      border-radius: 5.5px;
    }

    button {
      position: relative;
      display: inline;
      border: none;
      outline: none;
      width: 14px;
      height: 10px;
      border-radius: 5.5px 5.5px 0 0;
      // Icon
      &::before {
        @include centered-mask-image;
        content: '';
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        transform: rotateZ(180deg) scale(0.7);
        transform-origin: center;
        -webkit-mask-size: 10px;
        -webkit-mask-image: var(--stepper-chevron-icon);
      }
      // Separator
      &::after {
        content: '';
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
      }
    }

    button.down {
      transform: rotateZ(180deg);
    }

    .label {
      @include system-regular-font;
      color: var(--label-color);
      transform: translate(0, 3px);
      user-select: none;
      margin-left: 5px;
    }
  }

  // ------ Layout: Compact ------ //

  // ------ Default ------ //

  input {
    // Dark box. White label
    border: none;

    @include light {
      background: backgroundColor(1);
      box-shadow: 
        inset 0 -1px 0 0 black(0.15), // Bottom shadow
        inset 0 0 0 0.5px black(0.15); // Border
    }
    
    @include dark {
      color: var(--text-color);
      background: foregroundColor(0.07);
      // border: 1px solid white(0.1);
      // box-shadow: inset 0 0 0 1px white(0.1);
      box-shadow: 
        inset 0 -1px 0 0 white(0.075), // Bottom highlight
        inset 0 0 0 0.5px white(0.1), // Border
        inset 0 1px 0.5px 0 black(0.15); // Top shadow
    }
  }

  .buttons {
    @include light { box-shadow: 0 0 2px 0 black(0.1); }
  }

  button { 
    @include dark {
      background: var(--button-background);
      &::before { background: white; }
      &::after { box-shadow: inset 0 -0.5px 0 0 black(0.16); }
    }
    
    @include light {
      // Light is white, with subtle shadow gradient at base.
      background: 
        linear-gradient(black(0) 75%, black(0.08) 99%), // Shadow gradient
        var(--button-background);
      box-shadow: 
        inset 0 0.5px 0 0.5px black(0.1),
        inset 0 0 0 0.5px black(0.2);
      &::before { background: var(--label-color); }
      // Separator in light mode is defined by box-shadow on overall element.
      // &::after { box-shadow: inset 0 0 0 0 white(0.5); }
    }

    &.up {
      // Top-edge bevel
      @include dark {
        box-shadow: inset 0 0.5px 0 0 white(0.1);
      }
    }
  }

  // ------ Focused ------ //

  .input:focus-within {
    border-radius: 1px;
    &::after {
      @include focusRingAnimation; 
    }
  }

  // ------ Active ------ //
  // Active styles only apply if stepper is enabled
  .stepper:not(.disabled) button:active {
    @include dark { filter: brightness(1.25); }
    @include light { filter: brightness(0.9); }
  }

  // ------ Disabled ------ //
  .disabled .input,
  .disabled .buttons {
    opacity: 0.4;
  }

  .disabled .label {
    opacity: 0.3;
  }

  // ------ Window not focused ------ //
  // Stepper does not have "window not focused" styles


</style>


<label
  class="stepper"
  class:compact
  class:windowFocused={$isWindowFocused} 
  class:disabled
  class:windowHidden={!$isWindowFocused}
  use:setSize={{margin}}
  on:mousedown|preventDefault 
  >
  <span class="input">
    <input 
      type="text" 
      disabled={disabled} 
      tabindex={tabindex}
      bind:value 
      use:setSize={{width}}
    >
  </span>
  <span class="buttons">
    <button class="up" disabled={disabled} tabindex=-1 on:click={up}></button>
    <button class="down" disabled={disabled} tabindex=-1 on:click={down}></button>
  </span>
  <span class="label">{label}</span>
</label>

