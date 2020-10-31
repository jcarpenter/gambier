<script>
  export let width = 34
  export let height = 28
  export let borderRadius = 6
  export let iconImage = null
  export let iconColor = '--controlTextColor'
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
      iconStyles = `-webkit-mask-image: var(${iconImage}); background-color: var(${iconColor});`
    }
  }
</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  .button {
    position: relative;
    &:hover {
      background-color: var(--disabledControlTextColor);
    }
  }

  .icon {
    @include absolute_centered;
    @include centered_mask_image;
    width: 18px;
    height: 18px;
  }
</style>

<div class="button" role="button" style={buttonStyles}>
  <div class="icon" style={iconStyles} />
  {#if label}
    <div class="label">{label}</div>
  {/if}
  {#if tooltip}
    <div class="tooltip">{tooltip}</div>
  {/if}
</div>
