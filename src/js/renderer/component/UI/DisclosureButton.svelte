<script>
  import { createEventDispatcher } from 'svelte'
  import { css } from '../actions/css'
  const dispatch = createEventDispatcher()

  export let width = 34
  export let height = 28
  export let padding = 4
  export let left = 4
  export let rotation = 0

  export let iconImage = 'img-chevron-right'
  export let iconColor = 'controlTextColor'
  export let label = null
  export let tooltip = null

</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  .disclosure {
    --width: 0;
    --height: 0;
    --padding: 0;
    --left: 0;
    --rotation: 0;
    @include absolute-vertical-center;
    position: absolute;
    width: calc(var(--width) * 1px);
    height: calc(var(--height) * 1px);
    left: calc(var(--left) * 1px);
    // &:hover {
    //   background-color: var(--disabledControlTextColor);
    // }
    // outline: 2px solid pink;
  }

  .icon {
    @include centered_mask_image;
    width: calc(100% - calc(var(--padding) * 1px));
    height: calc(100% - calc(var(--padding) * 1px));
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotateZ(calc(var(--rotation) * 1deg));
    // outline: 2px solid turquoise;
  }
</style>

<div
  class="disclosure"
  use:css={{ width, height, left, padding, rotation }}
  on:mousedown|stopPropagation={() => dispatch('toggle')}
  role="button">
  <div class="icon" style={`background-color: var(--${iconColor}); -webkit-mask-image: var(--${iconImage});`} />
  {#if label}
    <div class="label">{label}</div>
  {/if}
  {#if tooltip}
    <!-- <div class="tooltip">{tooltip}</div> -->
  {/if}
</div>
