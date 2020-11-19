<script>
  import { createEventDispatcher, onMount } from 'svelte'
  import Expandable from '../UI/Expandable.svelte'
  import { css } from '../actions/css.js'
  
  // const dispatch = createEventDispatcher()

  export let item = {}
  export let listHasFocus = false
  export let isQueryEmpty = true

  let duration = 250
  let itemHeight = 28
  let itemWidth = 230
  let width = 230

  let type = null
  let childrenWrapper1
  let childrenWrapper2
  let mounted = false
  let expandable


  $: nestDepth = item.details.nestDepth
  
  $: indexInVisibleSiblings = item.indexInVisibleSiblings
  $: numberOfVisibleSiblings = item.numberOfVisibleSiblings
  $: numberOfVisibleChildren = item.numberOfVisibleChildren ? item.numberOfVisibleChildren : 0

  $: isSelected = item.isSelected
  $: isVisible = item.isVisible
  $: isExpandable =
    item.type == 'folder' && item.children && item.children.length > 0
  $: isExpanded = isExpandable && item.isExpanded

  // TODO: If height shrinks, height transition = step-end (so we don't shrink until animation is complete). If height grows, step-start, so we immediately create the space for the elements to expand into, without causing clipping.

  // $: {
  //   if (mounted && childrenWrapper1) {
  //     if (isExpanded) {
  //       // EXPAND
  //       expandable.expand()
  //       // expand(childrenWrapper1, childrenWrapper2, 800, 'ease-out')
  //       // childrenWrapper2.animate([
  //       //   { transform: 'scaleY(10)' },
  //       //   { transform: 'scaleY(1)' }
  //       // ], {
  //       //   duration: duration
  //       // })
  //     } else {
  //       // COLLAPSE
  //       expandable.collapse()
  //       // collapse(childrenWrapper1, childrenWrapper2, 800, 'ease-out')
  //       // childrenWrapper2.animate([
  //       //   { transform: 'scaleY(1)' },
  //       //   { transform: 'scaleY(10)' }
  //       // ], {
  //       //   duration: duration
  //       // })
  //     }
  //   }
  // }

  // onMount(async () => {
  //   mounted = true
  //   expandable = new Expandable(childrenWrapper1, childrenWrapper2, 250, 'ease-out')
  // });

  // Set `type`
  $: {
    switch (item.type) {
      case 'folder':
      case 'doc':
        type = item.type
        break
      case 'media':
        switch (item.details.filetype) {
          case '.png':
          case '.jpg':
          case '.gif':
            type = 'image'
            break
          default:
            type = 'av'
            break
        }
        break
    }
  }
</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  .wrapper {
    --indexInVisibleSiblings: 0;
    --itemHeight: 0;
    --duration: 0;
    // --numberOfVisibleSiblings: 0;
    // --numberOfVisibleChildren: 0;
    // --sidesPadding: 10px;
    // --transitionSpeed: 250ms;

    // tranform-origin: left top;
    position: absolute;
    transform: translate(
      0,
      calc(var(--indexInVisibleSiblings) * calc(var(--itemHeight) * 1px))
    );
    transition: transform var(--duration) ease-out;
  }
</style>

<svelte:options immutable={true} />
<div
  class="wrapper"
  class:isExpanded
  use:css={{indexInVisibleSiblings, itemHeight, duration}}>
  

  <!-- {#if isQueryEmpty} -->
  {#if isExpandable}
    <Expandable duration={duration} top={itemHeight} width={itemWidth} height={numberOfVisibleChildren * itemHeight}>
      {#each item.children as child}
        <svelte:self
          item={child}
          listHasFocus
          isQueryEmpty
          on:mousedown
          on:toggleExpanded />
      {/each}
    </Expandable>
  {/if}
  <!-- {/if} -->

</div>
