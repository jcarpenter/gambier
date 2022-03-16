
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

/**
 * Set parent to overflow:hidden to make it look like the sliding element is being masked.
 * @param {*} node 
 * @param {*} param1 
 */
export function slideUp(node, { duration = 100, easing = standardEase }) {
  return {
    duration: duration,
    easing,
    css: (t, u) => `transform: translate(0, ${u * -100}%)`,
  }
}