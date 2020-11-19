
import { standardEase } from './easing'

/**
 * Mask: We use transform scaling to make it look like the parent's height is animating and masking the child. We don't want to animate `height` for performance reasons, so we instead we use the scale/counter-scale method. We scale parent element down to zero, and child element up in equal proportion. If parent is set 'overflow:hidden' this makes it look like children are staying the same size, and being masked.
 * @param {*} node 
 * @param {*} param1 
 */
export function maskParent(node, { duration = 100, easing = standardEase }) {
  return {
    duration,
    easing,
    css: (t, u) => `transform: scale(1, ${t})`,
  }
}

export function maskChild(node, { duration = 100, easing = standardEase }) {
  return {
    duration,
    easing,
    css: (t, u) => `transform: scale(1, ${1 / t})`,
  }
}

/**
 * Set parent to overflow:hidden to make it look like the sliding element is being masked.
 * @param {*} node 
 * @param {*} param1 
 */
export function slideUp(node, { duration = 100, easing = standardEase }) {
  return {
    duration,
    easing,
    css: (t, u) => `transform: translate(0, ${u * -100}%)`,
  }
}
