import { macOsDefaultEasing } from './easing'

/* -------------------------------------------------------------------------- */
/*                              SVELTE ANIMATIONS                             */
/* -------------------------------------------------------------------------- */

/*
"An animation is triggered when the contents of a keyed each block are re-ordered. Animations do not run when an element is added or removed, only when the index of an existing data item within the each block changes. Animate directives must be on an element that is an immediate child of a keyed each block." — https://svelte.dev/docs#template-syntax-element-directives-animate-fn
*/

/**
 * Svelte custom animation - Test
 * @param {*} node 
 * @param {*} param1 
 * @param {*} param2 
 * @returns 
 */
 export function testSlide(node, { from, to }, { delay = 0, duration = 250, easing = macOsDefaultEasing }) {
  const dy = from.top - to.top;
  const dy2 = from.y - to.y;
  return {
    delay,
    duration,
    easing,
    css: (t, u) => `transform: translate(0, ${u * dy}px)`,
  }
}