<script>
  import { isWindowFocused } from "../../StateManager";

  export let label = '' // 'Settings'
  export let icon = '' // 'img-photo'
  export let isSelected = false
</script>

<style type="text/scss">

  // Layout
  .tab {    
    width: 55px;
    height: 45px;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
    -webkit-app-region: no-drag;

    .icon {
      @include centered_mask_image;
      width: 23px;
      min-height: 21px;
      margin-top: 5px;
      margin-bottom: 2px;
      pointer-events: none;
    }
    
    .label {
      @include label-normal-small;
      text-align: center;
      margin: 0;
      padding: 0;
      pointer-events: none;
    }
  }

  // Window focused
  .tab.isWindowFocused {

    &:not(.isSelected) {
      background-color: none;
      .icon {
        @include dark { 
          background-color: var(--secondaryLabelColor); 
        }
        @include light { 
          background-color: var(--labelColor); 
          opacity: 0.75;
        }
      }
      .label {
        @include dark { 
          color: var(--secondaryLabelColor); 
        }
        @include light { 
          color: var(--labelColor); 
          opacity: 0.75;
        }
      }
    }

    &:not(.isSelected):hover {
      @include dark { background: white(0.08); }
      @include light { background: black(0.05); }
    }

    &:not(.isSelected):active {
      @include dark { background: white(0.12); }
      @include light { background: black(0.08); }

      .icon {
        @include dark { background: var(--labelColor); }
        @include light { background: var(--labelColor); }
      }
      .label {
        @include dark { color: var(--labelColor); }
        @include light { color: var(--labelColor); }
      }
    }
    
    &.isSelected {
      @include dark { background: white(0.08); }
      @include light { background: black(0.05); }

      .icon {
        background-color: var(--controlAccentColor);
        @include dark { filter: brightness(1.6); }
        // @include light { }
      }
      .label {
        color: var(--controlAccentColor);
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
  
  // Window NOT focused
  .tab:not(.isWindowFocused) {

    &.isSelected {
      @include dark { background: white(0.08); }
      @include light { background: black(0.05); }
    }

    &:not(.isSelected) {
      @include dark { opacity: 0.5; }
      @include light { opacity: 0.6; }
    }

    .icon {
      @include dark { background: var(--secondaryLabelColor); }
      @include light { background: var(--secondaryLabelColor); }
    }

    .label {
      @include dark { color: var(--secondaryLabelColor); }
      @include light { color: var(--secondaryLabelColor); }
    }
  }
</style>

<div class="tab" class:isWindowFocused={$isWindowFocused} class:isSelected on:mouseup>
  <div class="icon" style={`-webkit-mask-image: var(--${icon});`}></div>
  <h1 class="label">{label}</h1>
</div>