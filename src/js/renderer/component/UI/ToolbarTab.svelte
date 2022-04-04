<script>
  import { isWindowFocused, state } from "../../StateManager";

  export let label = '' // 'Settings'
  export let icon = '' // 'img-photo'
  export let isSelected = false

  $: tabindex = $state.system.keyboardNavEnabled ? 0 : -1

</script>

<style type="text/scss">

  // Layout
  .tab {    
    width: 58px;
    height: 44px;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
    -webkit-app-region: no-drag;

    .icon {
      @include centered-mask-image;
      width: 23px;
      min-height: 21px;
      margin-top: 5px;
      margin-bottom: 2px;
      pointer-events: none;
    }
    
    .label {
      @include system-small-font;
      text-align: center;
      margin: 0;
      padding: 0;
      pointer-events: none;
    }

    &:focus {
      @include focusRingAnimation;
      outline: none;
    }
  }

  // Window focused
  .tab:not(.windowHidden) {

    &:not(.isSelected) {
      background-color: none;
      .icon {
        @include light { 
          background-color: var(--label-color); 
          opacity: 0.75;
        }
        @include dark { 
          background-color: var(--label-2-color); 
        }
      }
      .label {
        @include light { 
          color: var(--label-color); 
          opacity: 0.75;
        }
        @include dark { 
          color: var(--label-2-color); 
        }
      }
    }

    &:not(.isSelected):hover {
      @include light { background: black(0.05); }
      @include dark { background: white(0.08); }
    }

    &:not(.isSelected):active {
      @include light { background: black(0.08); }
      @include dark { background: white(0.12); }

      .icon {
        @include light { background: var(--label-color); }
        @include dark { background: var(--label-color); }
      }
      .label {
        @include light { color: var(--label-color); }
        @include dark { color: var(--label-color); }
      }
    }
    
    &.isSelected {
      @include light { background: black(0.05); }
      @include dark { background: white(0.08); }

      .icon {
        background-color: var(--nav-icon-color);
        @include dark { filter: brightness(1.6); }
        // @include light { }
      }
      .label {
        color: var(--nav-icon-color);
        @include dark { filter: brightness(1.6); }
        // @include light { }
      }
    }

    &.isSelected:hover {
      .icon {
        @include dark { filter: brightness(2.25); }
        @include light { filter: brightness(0.7); }
      }
      .label {
        @include dark { filter: brightness(2.25); }
        @include light { filter: brightness(0.7); }
      } 
    }
  }
  
  // Window NOT visible
  .tab.windowHidden {

    &.isSelected {
      @include light { background: black(0.05); }
      @include dark { background: white(0.08); }
    }

    &:not(.isSelected) {
      @include light { opacity: 0.6; }
      @include dark { opacity: 0.5; }
    }

    .icon {
      background: var(--label-2-color);
    }

    .label {
      color: var(--label-2-color);
    }
  }
</style>

<div 
  class="tab" 
  class:isSelected 
  tabindex={tabindex}
  class:windowHidden={!$isWindowFocused} 
  on:click
  on:mousedown|preventDefault
  on:keydown={(evt) => {
    if (evt.code == 'Space') {
      evt.target.click()
    }
  }}
>
  <div class="icon" style={`-webkit-mask-image: var(--${icon});`}></div>
  <h1 class="label">{label}</h1>
</div>