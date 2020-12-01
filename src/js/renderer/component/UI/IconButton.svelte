<script>
  import { css, setTooltip } from './actions';

  export let height = 28
  export let icon = null // E.g. '--img-photo'
  export let showCaret = false
  export let isActive = false
  export let tooltip = 'Wonder wider'

  // export let iconColor = '--controlTextColor'

</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  .button {
    --height: 0;
    min-width: 34px;
    height: calc(var(--height) * 1px);
    border-radius: 6px;
    padding: 0 10px;
    position: relative;
    display: flex;
    align-items: center;
    outline: none;
  }

  .icon,
  .caret {
    @include centered_mask_image;
    pointer-events: none;
    background-color: rgba(var(--foregroundColor), 0.6);
  }

  .icon {
    width: 18px;
    height: 18px;
  }

  .caret {
    margin: 0 -2px 0 7px;
    width: 8px;
    height: 8px;
    border: 1px solid black;
    -webkit-mask-image: var(--img-chevron-down-heavy);
  }

  .tooltip {
    position: absolute;
  }

  // Hover and 'active' styles.
  .button.isActive,
  .button:hover {
    background-color: rgba(var(--foregroundColor), 0.04);
    .caret {
      background-color: var(--labelColor);
    }
  }

</style>

<div class:isActive class="button" role="button" use:setTooltip={tooltip} use:css={{height}} tabindex="0" on:mousedown>
  <div class="icon" style={`-webkit-mask-image: var(${icon});`} />
  {#if showCaret}
    <div class="caret" />
  {/if}
</div>
