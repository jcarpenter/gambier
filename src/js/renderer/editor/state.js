import { create_bidirectional_transition } from "svelte/internal"

// Editor state object. We update this in `dispatch`
export let editorState = {
  panel: {},
  isMetaKeyDown: false,
  unsavedChanges: false,
  sourceMode: false,
  lastChanges: {},
  showAutocomplete: false,
  doc: {},
  mark: {
    hovered: null,
    selected: null,
    target: null,
    isHovered: false,
    isSelected: false,
  },
  selections: [],
  blockElements: [],
  inlineElements: [],
}

/**
 * Immutably update `cm.state `, ala redux reducers. Take an action with `type` and other optional properties, apply changes to a copy of the starting state, and lastly, set `cm.state` to this modified copy.
 * @param {*} action 
 */
export function dispatch(action) {

  // `cm = this` because `dispatch` is set as a method on the `cm` object.
  // This is for convenience's sake. We could just as easily keep dispatch
  // as a separate utility method, and pass in `cm` instance as argument.
  // That's is what we do for all other utility methods. We use `this` for
  // dispatch because we call it often, and `cm.dispatch()` is terse.
  const cm = this

  // Start with a copy of the current state.
  let newState = { ...cm.state }
  let changes = [] // array of changes as strings

  switch (action.type) {

    case 'setMetaKey':
      newState.isMetaKeyDown = action.isMetaKeyDown
      cm.getScrollerElement().setAttribute(
        'data-metakeydown',
        action.isMetaKeyDown
      )
      changes.push('metaKey')
      break

    case 'changes':
      newState.lastChanges = action.changes
      changes.push('lastChanges')
      break

    case 'setAutoComplete':
      newState.showAutocomplete = action.value
      changes.push('showAutoComplete')
      break

    // case 'setSourceMode':
    //   newState.sourceMode = action.boolean
    //   CodeMirror.signal(this, 'stateChanged', 'sourceMode')
    //   break

    case 'setSelections':
      newState.selections = cm.getDoc().listSelections()
      changes.push('selections')
      break

    case 'hoverMark':
      newState.mark.hovered = action.target
      changes.push('mark', 'hovered')
      break

    case 'selectMark':
      cm.setSelection(
        { line: action.target.line, ch: action.target.start },
        { line: action.target.line, ch: action.target.end }
      )
      newState.selections = cm.getDoc().listSelections()
      newState.mark.selected = action.target
      changes.push('mark', 'selected')
      break

    case 'deSelectMark':
      newState.mark.selected = null
      changes.push('mark', 'selected')
      break
  }

  // Update cm.state to newState
  cm.state = newState

  // Emit `stateChanged` event
  CodeMirror.signal(this, 'stateChanged', [...changes])
}
