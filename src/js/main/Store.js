import ElectronStore from 'electron-store'
// import { StoreSchema } from './store-schema'
import { storeDefault } from './store-default'
import reducers from './reducers'

import colors from 'colors'
import deepEql from 'deep-eql'
// import { updatedDiff, detailedDiff } from 'deep-object-diff'

class Store extends ElectronStore {
  constructor() {
    // Note: `super` lets us access and call functions on object's parent (MDN)
    // We pass in our config options for electron-store
    // Per: https://github.com/sindresorhus/electron-store#options
    super({
      name: "store",
      defaults: storeDefault
      // schema: StoreSchema
    })
  }

  getCurrentState() {
    return this.store
  }

  async dispatch(action) {

    // Optional: Log the changes (useful for debug)
    this.logTheAction(action)

    // Get next state
    const nextState = await reducers(this.getCurrentState(), action)

    // Optional: Log the diff (useful for debug)
    this.logTheDiff(this.getCurrentState(), nextState)

    // Set the next state
    this.set(nextState)
  }

  logTheAction(action) {
    console.log(
      `Action:`.bgBrightGreen.black,
      `${action.type}`.bgBrightGreen.black.bold,
      `(Store.js)`.green
    )
  }

  logTheDiff(currentState, nextState) {
    const hasChanged = !deepEql(currentState, nextState)
    if (hasChanged) {
      // const diff = detailedDiff(currentState, nextState)
      // console.log(diff)
      console.log(`Changed: ${nextState.changed}`.yellow)
    } else {
      console.log('No changes'.yellow)
    }
  }
}

export { Store }