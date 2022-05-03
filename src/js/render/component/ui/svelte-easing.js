import BezierEasing from 'bezier-easing'

// We use 'bezier-easing' package to convert CSS cubic bezier easing 
// curves to easing functions (which Svelte transitions require).

// To use in CSS, use `--macos-default-easing` variable,
// which is defined in _mac-misc.scss.

const macOsDefaultEasingCurve = BezierEasing(0.25, 0.1, 0.25, 1)
const cssEaseInOutCurve = BezierEasing(0.42, 0.0, 0.58, 1.0)

/**
 * "The system default timing function. Use this function to ensure that the timing of your animations matches that of most system animations."
 * https://cubic-bezier.com/#.25,.1,.25,1
 * https://developer.apple.com/documentation/quartzcore/camediatimingfunctionname/1521854-default
 * @param {*} t 
 * @returns 
 */
export function macOsDefaultEasing(t) {
  return macOsDefaultEasingCurve(t)
}

/**
 * Same values as CSS ease-in-out function
 * https://cubic-bezier.com/#.42,0,.58,1
 * @param {*} t 
 * @returns 
 */
export function cssEaseInOut(t) {
  return cssEaseInOutCurve(t)
}
