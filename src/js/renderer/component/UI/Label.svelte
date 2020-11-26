<script>
  import { css } from '../ui/actions'
  
  export let opacity = '1'
  export let display = 'block'
  export let align = 'left'
  export let color = 'primary'
  export let typography = 'label-normal'
</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  div, span {
    --opacity: 1;
    --align: 1;
    opacity: var(--opacity);
    text-align: var(--align);
  }

  div {
    flex-grow: 1;
  }

  // Color
  .primary {
    color: var(--labelColor);
  }

  .secondary {
    color: var(--secondaryLabelColor);
  }

  .tertiary {
    color: var(--tertiaryLabelColor);
  }

  .quaternary {
    color: var(--quaternaryLabelColor);
  }

  // Typography
  .label-normal {
    @include label-normal;
  }

  .label-normal-small {
    @include label-normal-small;
  }

  .label-normal-small-bold {
    @include label-normal-small-bold;
  }

  .label-large-bold {
    @include label-large-bold;
  }

  .column {
    @include column;
  }
</style>

{#if display == 'block'}
  <div class="label {color} {typography}" use:css={{opacity, align}}>
    <slot></slot>
  </div>
{:else if display == 'inline'}
  <span class="label {color} {typography}" use:css={{opacity, align}}>
    <slot></slot>
  </span>
{/if}
