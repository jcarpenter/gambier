import { saveDoc, loadDoc } from "./editor-utils"

// Editor state object. We update this in `dispatch`
export let editorState = {
  panel: {},
  isMetaKeyDown: false,
  unsavedChanges: false,
  sourceMode: false,
  lastChanges: {},
  doc: {},
  widget: {
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

  switch (action.type) {

    case 'panelChanged':
      newState.panel = { ...action.panel }
      break

    case 'loadDoc':
      
      // Save outgoing doc (if one is open)
      if (newState.doc && newState.panel.unsavedChanges) {
        saveDoc(cm, newState.doc)
      }
      
      // Create copy of doc to reduce risk of accidentally mutating original.
      newState.doc = { ...action.doc }
      
      // Load new doc
      loadDoc(cm, action.doc)
      break

    case 'setMetaKey':
      newState.isMetaKeyDown = action.isMetaKeyDown
      cm.getScrollerElement().setAttribute(
        'data-metakeydown',
        action.isMetaKeyDown
      )
      CodeMirror.signal(this, 'stateChanged', 'metaKey')
      break

    case 'changes':
      newState.lastChanges = action.changes
      CodeMirror.signal(this, 'stateChanged', 'lastChanges')
      break

    case 'setSourceMode':
      newState.sourceMode = action.boolean
      CodeMirror.signal(this, 'stateChanged', 'sourceMode')
      break

    case 'setSelections':
      newState.selections = cm.getDoc().listSelections()
      CodeMirror.signal(this, 'stateChanged', 'selections')
      break

    case 'hoverWidget':
      newState.widget.hovered = action.target
      CodeMirror.signal(this, 'stateChanged', ['widget', 'hovered'])
      break

    case 'selectWidget':
      cm.setSelection(
        { line: action.target.line, ch: action.target.start },
        { line: action.target.line, ch: action.target.end }
      )
      newState.selections = cm.getDoc().listSelections()
      newState.widget.selected = action.target
      CodeMirror.signal(this, 'stateChanged', ['widget', 'selected'])
      break

    case 'deSelectWidget':
      newState.widget.selected = null
      CodeMirror.signal(this, 'stateChanged', ['widget', 'selected'])
      break
  }
  
  // Apply newState to state
  cm.state = newState
}
