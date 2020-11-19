import BezierEasing from 'bezier-easing'

const standard = BezierEasing(0.4, 0, 0.2, 1)
const decelerate = BezierEasing(0, 0, 0.2, 1)

export function standardEase(t) {
  return standard(t)
}

export function decelerateEase(t) {
  return decelerate(t)
}