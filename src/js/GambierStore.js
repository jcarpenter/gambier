import Store from 'electron-store'
import { StoreSchema } from './store-schema'
import reducers from './reducers'

class GambierStore extends Store {
  constructor() {
    // Note `Super` lets us access and call functions on object's parent (MDN)
    // We pass in our config options for electron-store
    // Per: https://github.com/sindresorhus/electron-store#options
    super({
      name: "store",
      schema: StoreSchema
    })
  }

  getPreviousState() {
    return this.store
  }

  dispatch(action) {
    let nextState = reducers(this.getPreviousState(), action)
    this.set(nextState)
  }
}

export const store = new GambierStore()