<script lang='js'>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let isSelected = false
  export let label = ''

</script>

<style lang="scss">

  .token {
    @include system-regular-font;
    color: var(--label-2-color);
    padding: 0 4px;
    border-radius: 3px;
    background-color: foregroundColor(0.08);
    margin-left: 3px;
    height: 16px;
    display: inline-flex;
    align-items: center;
    user-select: none;
    white-space: nowrap;
  }

  .token:first-child {
    margin: 0;
  }

  .isSelected {
    color: var(--control-selected-text-color);
    background-color: foregroundColor(0.3);
  }
  
</style>

<span class="token" class:isSelected on:click={(evt) => dispatch('select', { domEvent: evt, tag: label })}>
  {label}
</span>