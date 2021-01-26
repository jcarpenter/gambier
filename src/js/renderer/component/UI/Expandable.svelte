<script>
  import { css } from '../ui/actions'
  import DisclosureButton from './DisclosureButton.svelte';

  export let title = 'Title'
  export let maxExpandedHeight = 100
  export let isOpen = true

</script>

<style type="text/scss">

  .expandable {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    transition: flex 250ms ease-out;
    // max-height: 215px;
    overflow: hidden;
    // border: 1px solid red;

    &.isOpen {
      flex-basis: calc(var(--maxExpandedHeight) * 1px);
    }

    &:not(.isOpen) {
      flex-basis: 20px;
    }
  }

  header {
    padding: 0 10px;
    display: flex;
    position: relative;
    flex-direction: row;
    align-items: center;
    min-height: 20px;
    user-select: none;
    // outline: 1px solid black;

    h1 {
      @include label-normal-small-bold;
      color: var(--labelColor);
      font-weight: bold;
      flex-grow: 1;
      margin: 0;
      padding: 0;
      position: absolute;
      left: 22px;
    }
  }


</style>

<svelte:options immutable={true} />

<div class="expandable" class:isOpen use:css={{ maxExpandedHeight }}>
  <header>
    <DisclosureButton
      width='12px'
      height='12px'
      padding='2.5px'
      left={8}
      opacity={0.6}
      rotation={isOpen ? 0 : -90}
      on:toggle />
    <h1>{title}</h1>
  </header>
  <div class="content">
    <slot />
  </div>
</div>
