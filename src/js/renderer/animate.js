// function ease(v, pow = 4) {
//   const value = 1 - Math.pow(1 - v, pow);
//   // const valueRounded = Math.round(value * 100 + Number.EPSILON) / 100
//   return value
// }

// function roundToThreeDecimalPlaces(num) {
//   return Math.round(num * 1000 + Number.EPSILON) / 1000
// }

export function expand(outer, inner, duration, easing) {

  let animation = []
  let inverseAnimation = []

  for (let step = 0; step <= 60; step++) {
    // Remap the step value to an eased one.
    let easedStep = ease(step / 100)

    // Calculate the scale of the element.
    const scale = roundToThreeDecimalPlaces(1 * easedStep)
    animation.push({ transform: `scaleY(${scale})` })

    // And now the inverse for the contents.
    const invScale = roundToThreeDecimalPlaces(1 / scale)
    inverseAnimation.push({ transform: `scaleY(${invScale})` })
  }

  animation[animation.length - 1] = { transform: `scaleY(1)` }
  inverseAnimation[0] = { transform: `scaleY(1000)` }
  inverseAnimation[inverseAnimation.length - 1] = { transform: `scaleY(1)` }

  console.log(animation)
  console.log(inverseAnimation)

  outer.animate(animation, {
    duration: duration,
    fill: 'forwards',
    ease: 'step-end'
  })

  inner.animate(inverseAnimation, {
    duration: duration,
    fill: 'forwards',
    ease: 'step-end'
  })
}




export function collapse(outer, inner, duration, ease) {
  outer.animate([
    { transform: 'scaleY(1)' },
    { transform: 'scaleY(0)' }
  ], {
    duration: duration,
    fill: 'forwards',
    ease: ease
  })
}







function ease(v, pow = 4) {
  const value = 1 - Math.pow(1 - v, pow);
  // const valueRounded = Math.round(value * 100 + Number.EPSILON) / 100
  return value
}

function roundToThreeDecimalPlaces(num) {
  return Math.round(num * 1000 + Number.EPSILON) / 1000
}

function setKeys(expandKeys, collapseKeys, totalSteps) {

  // Set expand keys
  for (let step = 0; step <= totalSteps; step++) {

    const isFirstStep = step == 0
    const isLastStep = step == totalSteps

    // Remap the step value to an eased one
    let easedStep = ease(step / 100)

    // Calculate the scale of the outer element
    const scale = roundToThreeDecimalPlaces(1 * easedStep)
    if (!isLastStep) {
      expandKeys.outer.push({ transform: `scaleY(${scale})` })
    } else {
      expandKeys.outer.push({ transform: `scaleY(1)` })
    }

    // And now the inverse for the inner element
    const invScale = roundToThreeDecimalPlaces(1 / scale)
    if (isFirstStep) {
      expandKeys.inner.push({ transform: `scaleY(1000)` })
    } else if (isLastStep) {
      expandKeys.inner.push({ transform: `scaleY(1)` })
    } else {
      expandKeys.inner.push({ transform: `scaleY(${invScale})` })
    }
  }

  // Set collapse keys
  for (let step = 0; step <= totalSteps; step++) {

    const isFirstStep = step == 0
    const isLastStep = step == totalSteps

    // Remap the step value to an eased one
    let easedStep = ease(step / 100)

    // Calculate the scale of the outer element
    const scale = roundToThreeDecimalPlaces(1 - 1 * easedStep)
    if (isFirstStep) {
      collapseKeys.outer.push({ transform: `scaleY(1)` })
    } else if (!isLastStep) {
      collapseKeys.outer.push({ transform: `scaleY(${scale})` })
    } else {
      collapseKeys.outer.push({ transform: `scaleY(0)` })
    }

    // And now the inverse for the inner element
    const invScale = roundToThreeDecimalPlaces(1 / scale)
    if (isFirstStep) {
      collapseKeys.inner.push({ transform: `scaleY(1)` })
    } else if (!isLastStep) {
      collapseKeys.inner.push({ transform: `scaleY(${invScale})` })
    } else {
      collapseKeys.inner.push({ transform: `scaleY(1000)` })
    }
  }
}


export class Expandable {
  constructor(outer, inner, duration, easing) {
    this.outer = outer
    this.inner = inner
    this.duration = duration
    this.easing = easing

    setKeys(this.expandKeys, this.collapseKeys, 60)
  }

  expandKeys = {
    outer: [],
    inner: []
  }

  collapseKeys = {
    outer: [],
    inner: []
  }

  expand() {
    this.outer.animate(this.expandKeys.outer, {
      duration: this.duration,
      fill: 'forwards',
      ease: 'step-end'
    })

    this.inner.animate(this.expandKeys.inner, {
      duration: this.duration,
      fill: 'forwards',
      ease: 'step-end'
    })
  }

  collapse() {
    this.outer.animate(this.collapseKeys.outer, {
      duration: this.duration,
      fill: 'forwards',
      ease: 'step-end'
    })

    this.inner.animate(this.collapseKeys.inner, {
      duration: this.duration,
      fill: 'forwards',
      ease: 'step-end'
    })
  }
}

