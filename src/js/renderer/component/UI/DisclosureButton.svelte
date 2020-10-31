<script>
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  export let width = 34
  export let height = 28
  export let borderRadius = 2
  export let iconImage = 'img-chevron-right'
  export let iconColor = 'controlTextColor'
  export let iconInset = 4
  export let label = null
  export let tooltip = null

  let buttonStyles = ''
  let iconStyles = ''

  // Button styles
  $: {
    buttonStyles = `width: ${width}px; height: ${height}px; border-radius: ${borderRadius}px;`
  }

  // Icon styles
  $: {
    if (iconImage) {
      iconStyles = `-webkit-mask-image: var(--${iconImage}); background-color: var(--${iconColor}); width: calc(100% - ${iconInset}px); height: calc(100% - ${iconInset}px);`
    }
  }
</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  .button {
    position: relative;
    // &:hover {
    //   background-color: var(--disabledControlTextColor);
    // }
  }

  .icon {
    @include absolute_centered;
    @include centered_mask_image;
  }
</style>

<div
  class="button"
  style={buttonStyles}
  role="button"
  on:mousedown|stopPropagation={() => dispatch('toggle')}>
  <div class="icon" style={iconStyles} />
  {#if label}
    <div class="label">{label}</div>
  {/if}
  {#if tooltip}
    <div class="tooltip">{tooltip}</div>
  {/if}
</div>
