<script lang='js'>
  import { setAsCustomPropOnNode, setSize } from '../ui/actions'
  import DisclosureButton from './DisclosureButton.svelte';

  export let title = 'Title'
  export let isOpen = true
  export let margin = '0';
  export let padding = '0';

  // Expanded mode will automatically fit height of slot content
  // If we want to set a max height and clip (for whatever reason)
  // we can set this value lower.
  export let maxExpandedHeight = 1000

</script>

<style lang="scss">

  .expandable {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    transition: max-height 250ms ease-out;
    overflow: hidden;

    // Animate height to fit content. Technique from:
    // https://dev.to/sarah_chima/using-css-transitions-on-the-height-property-al0

    &.isOpen {
      max-height: calc(var(--maxExpandedHeight) * 1px);
    }

    &:not(.isOpen) {
      max-height: 20px;
    }
  }

  header {
    padding: 0;
    display: flex;
    position: relative;
    flex-direction: row;
    align-items: center;
    min-height: 20px;
    user-select: none;
    // outline: 1px solid black;

    h1 {
      @include system-small-font;
      font-weight: bold;
      color: var(--label-color);
      font-weight: bold;
      flex-grow: 1;
      margin: 0;
      padding: 0;
      position: absolute;
      left: 14px;
    }
  }
</style>

<svelte:options immutable={true} />

<div 
  class="expandable" 
  class:isOpen 
  use:setAsCustomPropOnNode={{ maxExpandedHeight }}
>
  <header use:setSize={{margin}}>
    <DisclosureButton
      width='12px'
      height='12px'
      padding='2.5px'
      left={-2}
      opacity={0.6}
      rotation={isOpen ? 0 : -90}
      on:toggle />
    <h1>{title}</h1>
  </header>
  <div class="content" use:setSize={{padding}}>
    <slot />
  </div>
</div>
