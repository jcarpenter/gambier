export default function markImages(cm, lineHandle, elements, sourceMode) {

  const line = lineHandle.lineNo()
  const doc = cm.getDoc()
  const lineHasBlockStyles = lineHandle.styleClasses !== undefined

  if (elements.length > 0 && !lineHasBlockStyles && !sourceMode) {

    elements.forEach((e) => {

      const frag = document.createDocumentFragment();
      const span = document.createElement('span');
      span.innerText = 'i'
      span.classList.add('widget', 'icon', 'cm-image')
      span.addEventListener('mouseup', (event) => {
        event.preventDefault() // So editor doesn't lose focus.
        doc.setSelection({ line: line, ch: e.start }, { line: line, ch: e.end }, { scroll: true })
      })
      frag.append(span)

      cm.markText({ line: line, ch: e.start }, { line: line, ch: e.end }, {
        replacedWith: frag,
      })

      e.widget = true
    })
  }
}