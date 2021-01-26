<script>
  import { isWindowFocused } from '../../../StateManager';
  import { setSize } from '../actions';

  export let isActive = false
  export let width = '100px'
  export let margin = '0'
  export let label = 'Label'
  export let type = 'push' // push, pulldown, or popup
  export let disabled = false
  export let compact = false
    
</script>

<style type="text/scss">

  // We need to break the menu out any parent overflow:hidden elements (e.g. a sidebar tab), so we set position relative on the top div, and position fixed on the menu div. Per this tip: https://github.com/w3c/csswg-drafts/issues/4092#issuecomment-595247838

  // Compact
  .button.compact {
    @include label-normal-small;
    height: 18px;
    border-radius: 5px;
    .icon {
      top: 3px;
      right: 3px;
      width: 12px;
      height: 12px;
      border-radius: 3px;
      .img {
        -webkit-mask-size: 6px;
      }
    }
  }
  
  // Button
  .button {
    @include label-normal;
    height: 20px;
    user-select: none;
    position: relative;
    border-radius: 5px;
    display: flex;
    align-items: center;
    @include dark {
      background: #5B5B5B;
      box-shadow: 
        inset 0 0.5px 0 0 white(0.25),
        $dark-outline;
    }
    @include light {
      background-color: var(--controlBackgroundColor);
      box-shadow: 
        0 0 0 0.5px rgba(var(--foregroundColor), 0.2) inset, 
        0 0.5px 0 0 rgba(var(--foregroundColor), 0.15),
        0 1px 1px 0 rgba(var(--foregroundColor), 0.1);
    }

    // On press, tint whole button dark or light (depending on the mode)
    &.isActive {
      filter: brightness(0.95);
    }
  }

  
  .label {
    color: var(--labelColor);
    flex-grow: 1;
  }

  .push {
    &:active {
      background: var(--controlAccentColor);
      .label { 
        color: white; 
      }
    }
    .label {
      text-align: center;
    }
  }

  .popup .label,
  .pulldown .label {
    padding: 0 0 0 8px;
  }

  // Icon
  // And icon inside a blue square
  .icon {
    position: absolute;
    right: 2px;
    top: 2px;
    width: 16px;
    height: 16px;
    border-radius: 4px;
    @include dark {
      background: 
          linear-gradient(white(0.15), white(0)),
          linear-gradient(var(--controlAccentColor), var(--controlAccentColor));
      box-shadow: 
        inset 0 0.5px 0 0 white(0.6),
        0 0 0 0.5px black(0.25);
    }
    @include light {
      // TODO
    }

    .img {
      @include centered_mask_image;
      @include absolute_centered;
      width: 14px;
      height: 14px;
      background-color: white;
    }
  }

  .popup .img {
    -webkit-mask-image: var(--img-chevron-up-down);
  }

  .pulldown .img {
    -webkit-mask-image: var(--img-chevron-down-bold);
    -webkit-mask-size: 8px;
  }

  // ------ Window not focused ------ //
  .button:not(.isWindowFocused) .icon {
    @include dark { 
      background: none;
      box-shadow: none;
    }
  }

  // ------ Layout: Normal ------ //
  // ------ Layout: Compact ------ //
  // ------ Default ------ //
  // ------ Focused ------ //
  // ------ Active ------ //
  // ------ Disabled ------ //
  // ------ Window not focused ------ //

  
</style>

<div 
  class="button {type}" 
  class:isActive
  class:compact
  class:isWindowFocused={$isWindowFocused}
  use:setSize={{width, margin}} 
  on:mousedown 
  >
  <span class="label">{label}</span>
  {#if type == 'popup' || type == 'pulldown'}
    <span class="icon">
      <div class="img"></div>
    </span>
  {/if}
</div>