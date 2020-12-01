<script>
  import { css } from '../actions';

  export let isActive = false
  export let width = 100
  export let height = 22
  export let label = 'Label'
  export let type = 'push' // push, pulldown, or popup

  let isOpen = false
</script>

<style type="text/scss">
  @import '../../../../../styles/_mixins.scss';

  // We need to break the menu out any parent overflow:hidden elements (e.g. a sidebar tab), so we set position relative on the top div, and position fixed on the menu div. Per this tip: https://github.com/w3c/csswg-drafts/issues/4092#issuecomment-595247838

  // // Compact
  // .compact {
  //   .button {
  //     height: 14px;
  //     @include label-normal-small;
  //   }
  // }
  // Button
  .button {
    --width: 0;
    --height: 0;

    width: calc(var(--width) * 1px);
    height: calc(var(--height) * 1px);

    @include label-normal;
    user-select: none;
    position: relative;
    background-color: var(--controlBackgroundColor);
    border-radius: 7px;
    box-shadow: 
      0 0 0 0.5px rgba(var(--foregroundColor), 0.15) inset, 
      0 0.5px 0 0 rgba(var(--foregroundColor), 0.25);

    display: flex;
    align-items: center;
  
    // On press, tint whole button dark or light (depending on the mode)
    &.isOpen {
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
    right: 3px;
    top: 3px;
    width: 16px;
    height: 16px;
    background: var(--controlAccentColor);
    border-radius: 5px;

    .img {
      @include centered_mask_image;
      width: 100%;
      height: 100%;
      -webkit-mask-size: 8px;
      background-color: white;
      // background-size: 8px;
      // background-position: center;
      // background-repeat: no-repeat;
    }
  }

  .popup .img {
    -webkit-mask-image: var(--img-chevron-up-down);
  }

  .pulldown .img {
    -webkit-mask-image: var(--img-chevron-down-bold);
  }
  
</style>


<div 
  class="button {type}" 
  class:isOpen
  use:css={{width, height}} 
  on:mousedown 
  >
  <span class="label">{label}</span>
  {#if type == 'popup' || type == 'pulldown'}
    <span class="icon">
      <div class="img"></div>
    </span>
  {/if}
</div>