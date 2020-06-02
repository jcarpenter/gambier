import Store from 'electron-store'
import { StoreSchema } from './store-schema'
import reducers from './reducers'

import colors from 'colors'
import deepEql from 'deep-eql'
import { updatedDiff, detailedDiff } from 'deep-object-diff'

class GambierStore extends Store {
  constructor() {
    // Note: `super` lets us access and call functions on object's parent (MDN)
    // We pass in our config options for electron-store
    // Per: https://github.com/sindresorhus/electron-store#options
    super({
      name: "store",
      schema: StoreSchema
    })
  }

  getCurrentState() {
    return this.store
  }

  dispatch(action) {

    // Get next state
    const nextState = reducers(this.getCurrentState(), action)

    // Optional: Log the changes (useful for debug)
    this.logTheAction(action)
    this.logTheDiff(this.getCurrentState(), nextState)

    // Set the next state
    this.set(nextState)
  }

  logTheAction(action) {
    console.log(
      `Action:`.bgBrightGreen.black,
      `${action.type}`.bgBrightGreen.black.bold,
      `(GambierStore.js)`.green
    )
  }

  logTheDiff(current, next) {
    const hasChanged = !deepEql(current, next)
    if (hasChanged) {
      // const diff = detailedDiff(current, next)
      // console.log(diff)
      console.log('Has changed'.yellow)
    } else {
      console.log('No changes')
    }
  }
}

export const store = new GambierStore()