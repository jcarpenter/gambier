/**
 * "Fired whenever a line is (re-)rendered to the DOM. Fired right after the DOM element is built, before it is added to the document. The handler may mess with the style of the resulting element, or add event handlers, but should not try to change the state of the editor."
 * https://codemirror.net/doc/manual.html#event_renderLine
 * @param {*} cm 
 * @param {*} lineHandle 
 * @param {*} element 
 */
export function onRenderLine(cm, lineHandle, element) {
  // console.log('renderLine', lineHandle.lineNo())
  // return

  // const charWidth = cm.defaultCharWidth()
  // const basePadding = charWidth * 2
  // const indent = CodeMirror.countColumn(lineHandle.text, null, cm.getOption('tabSize')) * charWidth
  // if (indent) {
  //   element.style.textIndent = `-${indent}px`
  //   element.style.paddingLeft = `${basePadding + indent}px`
  // }

  const charWidth = cm.defaultCharWidth()
  // const basePadding = charWidth * 1
  const basePadding = 0
  const indent = CodeMirror.countColumn(lineHandle.text, null, cm.getOption('tabSize')) * charWidth
  if (indent) {
    element.style.textIndent = `-${indent}px`
    // element.style.borderLeftWidth = `${basePadding + indent}px`
    // element.style.borderStyle = `solid`
    // element.style.borderColor = `rgba(200, 0, 0, 0.2)`
    element.style.paddingLeft = `${basePadding + indent}px`
  }

}