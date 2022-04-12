<script lang='js'>
  import { setAsCustomPropOnNode } from '../ui/actions'
  
  export let opacity = '1'
  export let display = 'block'
  export let align = 'left'
  export let color = 'primary'
  export let typography = 'system-regular-font'
  export let isSelected = false

</script>

<style lang="scss">

  div, span {
    --opacity: 1;
    --align: 1;
    opacity: var(--opacity);
    text-align: var(--align);
  }

  .isSelected {
    color: var(--control-selected-text-color) !important;
  }

  div {
    flex-grow: 1;
  }

  // Color
  .primary {
    color: var(--label-color);
  }

  .secondary {
    color: var(--label-2-color);
  }

  .tertiary {
    color: var(--label-3-color);
  }

  .quaternary {
    color: var(--label-4-color);
  }

  // Typography
  .system-regular-font {
    @include system-regular-font;
  }

  // Typography
  .system-regular-font-bold {
    @include system-regular-font;
    font-weight: bold;
  }

  .system-small-font {
    @include system-small-font;
  }

  .system-small-font-bold {
    @include system-small-font;
    font-weight: bold;
  }

  .title1-emphasized-text {
    @include title1-emphasized-text;
  }

</style>

{#if display == 'block'}
  <div class="label {color} {typography}" class:isSelected use:setAsCustomPropOnNode={{opacity, align}}>
    <slot></slot>
  </div>
{:else if display == 'inline'}
  <span class="label {color} {typography}" class:isSelected use:setAsCustomPropOnNode={{opacity, align}}>
    <slot></slot>
  </span>
{/if}
