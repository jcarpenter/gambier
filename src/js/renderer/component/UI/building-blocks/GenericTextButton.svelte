<script>
  import { css } from '../actions';

  export let isActive = false
  export let width = 100
  export let label = 'Label'
  export let type = 'push' // push, pulldown, or popup
  export let isCompact = false
    
</script>

<style type="text/scss">

  // We need to break the menu out any parent overflow:hidden elements (e.g. a sidebar tab), so we set position relative on the top div, and position fixed on the menu div. Per this tip: https://github.com/w3c/csswg-drafts/issues/4092#issuecomment-595247838

  // Compact
  .button.isCompact {
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
    width: calc(var(--width) * 1px);
    height: 22px;

    @include label-normal;
    user-select: none;
    position: relative;
    background-color: var(--controlBackgroundColor);
    border-radius: 6px;
    box-shadow: 
      0 0 0 0.5px rgba(var(--foregroundColor), 0.2) inset, 
      0 0.5px 0 0 rgba(var(--foregroundColor), 0.15),
      0 1px 1px 0 rgba(var(--foregroundColor), 0.1);

    display: flex;
    align-items: center;
  
    // On press, tint whole button dark or light (depending on the mode)
    &.isActive {
      filter: brightness(0.95);
    }
  }

  
  .label {
    color: var(--labelColor);
    flex-grow: 1;
  }

  .push .label {
    text-align: center;
  }

  .popup .label,
  .pulldown .label {
    padding: 0 0 0 8px;
  }

  // Icon
  // And icon inside a blue square
  .icon {
    position: absolute;
    background: 
        linear-gradient(rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0)),
        linear-gradient(var(--controlAccentColor), var(--controlAccentColor));
    right: 3px;
    top: 3px;
    width: 16px;
    height: 16px;
    border-radius: 4px;

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
  
</style>


<div 
  class="button {type}" 
  class:isActive
  class:isCompact
  use:css={{width}} 
  on:mousedown 
  >
  <span class="label">{label}</span>
  {#if type == 'popup' || type == 'pulldown'}
    <span class="icon">
      <div class="img"></div>
    </span>
  {/if}
</div>