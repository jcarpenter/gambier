import { convertCSSTimeToMilliseconds } from '../../../shared/utils'
import { macOsDefaultEasing } from './svelte-easing'


/* -------------------------------------------------------------------------- */
/*                             SVELTE TRANSITIONS                             */
/* -------------------------------------------------------------------------- */

/*
"A transition is triggered by an element entering or leaving the DOM as a result of a state change.
When a block is transitioning out, all elements inside the block, including those that do not have their own transitions, are kept in the DOM until every transition in the block has completed. The transition: directive indicates a bidirectional transition, which means it can be smoothly reversed while the transition is in progress."
"https://svelte.dev/docs#template-syntax-element-directives-transition-fn"
*/

/**
 * Transition node position up/down 100% of height by animating 
 * the Y transform. Used when opening/closing folders in tree list.
 * NOTE: Set parent to overflow:hidden to make it look like the 
 * sliding element is being masked.
 * @param {*} node 
 * @param {*} param1 
 */
export function slideVertically(node, { delay = 0, duration = 250, easing = macOsDefaultEasing }) {
  return {
    delay,
    duration,
    easing,
    css: (t, u) => `transform: translate(0, ${u * -100}%)`,
  }
}

/**
 * "Mask" an element: collapse the box around it in X or Y axis,
 * without resizing the contents. Setup requires two elements:
 * a parent (the mask), and child. When collapsing, for example,
 * the parent scales down to zero, and the child scales up at
 * same rate. This makes the child contents look like they're not
 * scaling. And because parent has `overflow: hidden`, it clips
 * (masks) the child contents as it scales down.
 * We do all this to avoid animating `width` or `height` values to
 * achieve the same visual effect, because doing so would cause
 * reflows and repaints (serious performance imapct), whereas 
 * animating transform is cheap.
 * `direction` param can be "x" or "y".
 */
 export function mask(node, { thisNodeIsMask = false, direction = 'y', duration = 250, easing = macOsDefaultEasing}) {

  if (typeof duration === 'string') {
    duration = convertCSSTimeToMilliseconds(duration)
  }

  return {
    duration,
    easing,
    css: (t, u) => `transform: scale(
      ${direction == 'x' ? (thisNodeIsMask ? t : 1 / t) : 1}, 
      ${direction == 'y' ? (thisNodeIsMask ? t : 1 / t) : 1}
    )`,
  }
}
