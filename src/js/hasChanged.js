export default function hasChanged(key, newState, oldState) {
  return newState[key] !== oldState[key]
}