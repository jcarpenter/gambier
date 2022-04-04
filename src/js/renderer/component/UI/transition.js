import { cubicOut, linear } from 'svelte/easing'
import { convertCSSTimeToMilliseconds } from '../../../shared/utils'
import { standardEase } from './easing'


/**
 * "Mask" an element: collapse the box around it in X or Y axis,
 * without resizing the contents. Setup requires two elements:
 * a parent (the mask), and child. When collapsing (for example)
 * the parent scales down (to zero), and the child scales up at
 * same rate. This makes the child contents look like they're not
 * scaling. And because parent has `overflow: hidden`, it clips
 * (masks) the child contents as it scales down.
 * We do all this to avoid animating `width` or `height` values to
 * achieve the same visual effect, because doing so would cause
 * reflows and repaints (serious performance imapct), whereas 
 * animating transform is cheap.
 * `direction` param can be "x" or "y".
 */
export function mask(node, { thisNodeIsMask = false, direction = 'x', duration = 250}) {

  if (typeof duration === 'string') {
    duration = convertCSSTimeToMilliseconds(duration)
  }

  return {
    duration,
    easing: standardEase,
    css: (t, u) => `transform: scale(
      ${direction == 'x' ? (thisNodeIsMask ? t : 1 / t) : 1}, 
      ${direction == 'y' ? (thisNodeIsMask ? t : 1 / t) : 1}
    )`,
  }
}

// They start on the same beat. That works.
// But the transition finishes first. 
// The duration seems to be shorter.

// The gap is larger, the further they have to go
// Proportionally. 
// So it's not about starting point. 
// Suggests it's like a multiplier. 
// One is 0-1 * percentage    0.2 * -100 = -20%
// One is 0-1 * px value.     0.2 * 300  = -20%
// Maybe it really is just easing??

/**
 * Transition node position up/down by animating the Y transform.
 * Used when opening/closing folders.
 * NOTE: Set parent to overflow:hidden to make it look like the 
 * sliding element is being masked.
 * @param {*} node 
 * @param {*} param1 
 */
export function slideYPosition(node, { delay = 0, duration = 250, easing = linear }) {
  console.log(node)
  return {
    delay,
    duration,
    easing,
    css: (t, u) => `transform: translate(0, ${u * -100}%)`,
  }
}

export function testSlide(node, { from, to }, { delay = 0, duration = 250, easing = linear }) {
  const dy = from.top - to.top;
  const dy2 = from.y - to.y;
  // console.log(dy)
  console.log("testSlide", dy)
  // console.log(from, to)
  // console.log(easing)
  return {
    delay,
    duration,
    easing,
    css: (t, u) => `transform: translate(0, ${u * dy}px)`,
  }
}