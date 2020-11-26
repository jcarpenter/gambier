<script>
  import { css } from '../ui/actions'
  import { slide } from 'svelte/transition'
  import { linear, cubicOut } from 'svelte/easing'
  import BezierEasing from 'bezier-easing'

  import { standardEase } from './easing'

  export let duration = 0
  export let expandedHeight = 0
  export let top = 0
  export let itemWidth = 0
  export let isExpanded = true

  $: height = isExpanded ? expandedHeight : 0
  $: console.log(isExpanded, expandedHeight, height)

  // const asdsa = [0.4, 0.0, 0.2, 1]
  // const easing = BezierEasing(...asdsa)

  // function test(t) {
  //   // const f = t - 1.0
  //   // return f * f * f + 1.0
  //   return easing(t)
  // }

  function scale(node, { duration = 100 }) {
    return {
      duration,
      easing: standardEase,
      css: (t, u) => `transform: scale(1, ${t})`,
    }
  }

  function counterScale(node, { duration = 100 }) {
    return {
      duration,
      easing: standardEase,
      css: (t, u) => `transform: scale(1, ${1 / t})`,
    }
  }
</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  .outer {
    --duration: 0;
    --height: 0;
    --heightEasing: ;
    --top: 0;
    --itemWidth: 0;

    position: absolute;
    // contain: strict;
    // border: 2px solid rgba(255, 0, 0, 0.3);
    height: calc(var(--height) * 1px);
    // overflow: hidden;
    // top: calc(var(--top) * 1px);
    width: calc(var(--itemWidth) * 1px);
    // transition: height calc(var(--duration) * 1ms) step-end;
  }

  .outer,
  .inner {
    // contain: strict;
    // position: absolute;
    transform-origin: left top;
    will-change: transform;
  }
</style>

<svelte:options immutable={true} />
<div
  class="outer"
  transition:scale={{ duration: duration }}
  use:css={{ duration, height, top, itemWidth }}>
  <div transition:counterScale={{ duration: duration }} class="inner">
    <slot />
  </div>
</div>
