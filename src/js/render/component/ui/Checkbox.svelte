<script lang='js'>
  import { isWindowFocused, state } from "../../StateManager";
  import { setSize } from "./actions";
  export let label = 'Label'
  export let compact = false
  export let checked = false
  export let disabled = false
  export let margin = '0'

  $: tabindex = $state.system.keyboardNavEnabled ? 0 : -1

</script>

<style lang="scss">

  .checkbox {
    @include inset-button;

    .control {
      border-radius: 3px;
    }

    // Icon
    .control::before {
      @include centered-mask-image;
      opacity: 0;
      content: '';
      width: 100%;
      height: 100%;
      transform: translate(0, 0.5px);
      -webkit-mask-size: 10px;
      -webkit-mask-image: var(--checkbox-icon);
      background: var(--inset-button-background);
      box-shadow: var(--inset-button-boxshadow);
    }
  }

  .checkbox.compact {
    @include inset-button-compact;

    .control {
      border-radius: 2.5px;
      &::before {
        -webkit-mask-size: 8px !important;
        transform: translate(0, 0) !important;
      }
    }
  }

  .checkbox:focus {
    @include inset-button-focus;
  }

  .checkbox.checked {
    @include inset-button-checked;
  }
    
  .checkbox:not(.disabled):active {
    @include inset-button-active;
  }

  .checkbox.disabled {
    @include inset-button-disabled;
  }

  .checkbox.windowHidden {
    @include inset-button-windowHidden;
  }

</style>

<label 
  class="checkbox" 
  class:compact 
  class:checked
  disabled={disabled}
  tabindex={tabindex}
  class:windowHidden={!$isWindowFocused}
  use:setSize={{margin}}
  on:mousedown|preventDefault
  on:click
  on:keydown={(evt) => {
    // Click input when user presses spacebar
    if (evt.code == 'Space') {
      const input = evt.target.querySelector('input')
      input.click()
    }
  }}
>
  <span class="inputWrapper">
    <input type="checkbox" tabindex=-1 {disabled} {checked} />
    <span class="control"></span>
  </span>
  <span class="label">{label}</span>
</label>