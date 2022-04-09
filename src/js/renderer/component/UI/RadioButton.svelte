<script lang='js'>
  import { isWindowFocused, state } from "../../StateManager";
  import { setSize } from "./actions";

  export let group = undefined
  export let value = undefined
  export let label = ''
  // export let name = ''
  export let compact = false
  export let disabled = false
  export let margin = '0'
  
  $: tabindex = $state.system.keyboardNavEnabled && !disabled ? 0 : -1
  
  // Radio is checked when `group == value`
  $: checked = group == value

</script>

<style lang="scss">

  .radioButton {
    @include inset-button;

    .control { 
      border-radius: 50%;
    }
    
    // Dot
    .control::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      border-radius: inherit;
      width: 100%;
      height: 100%;
      transform: scale(0.4);
    }
  }

  .radioButton.compact {
    @include inset-button-compact;
    
  }

  .radioButton:focus {
    @include inset-button-focus;
  }

  .radioButton.checked {
    @include inset-button-checked;
  }
    
  .radioButton:not(.disabled):active {
    @include inset-button-active;
  }

  .radioButton.disabled {
    @include inset-button-disabled;
  }

  .radioButton.windowHidden {
    @include inset-button-windowHidden;
  }

</style>

<label 
  class="radioButton" 
  class:compact 
  class:checked
  class:disabled
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
    <input type="radio" bind:group tabindex=-1 value={value}>
    <span class="control"></span>
  </span>
  <span class="label">{label}</span>
</label>
